import ADMZip from "adm-zip";
import Crypto from "crypto";
import * as FS from "fs";
import _ from "lodash";
import {customAlphabet} from "nanoid";
import Path from "path";
import * as TypeORM from "typeorm";
import {v4} from "uuid";
import Entity, {Pagination} from "../../common/classes/Entity";
import PermissionLevel from "../../common/enums/PermissionLevel";
import SetOperation from "../../common/enums/SetOperation";
import ValidatorType from "../../common/enums/ValidatorType";
import ServerException from "../../common/exceptions/ServerException";
import Logger from "../../common/services/Logger";
import Server from "../../common/services/Server";
import FileExtension, {FileExtensionJSON} from "./FileExtension";
import FileTag, {FileTagJSON} from "./FileTag";
import FileType from "./FileType";
import User, {UserJSON} from "./User";
import Moment from 'moment';

const NanoID = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_", 16);

@TypeORM.Entity()
@TypeORM.Index("time_created", ["time_created"])
@TypeORM.Index("time_updated", ["time_updated"])
export default class File extends Entity<File>(TypeORM) {

  /**
   * Properties
   */

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 16})
  public alias: string;

  @TypeORM.Column({type: "varchar", length: 128})
  public name: string;

  @TypeORM.Column({type: "int"})
  public size: number;

  @TypeORM.ManyToMany(() => FileTag, tag => tag.file_list)
  @TypeORM.JoinTable({
    name:              `jct/file-file_tag`,
    joinColumn:        {name: "file_id", referencedColumnName: "id"},
    inverseJoinColumn: {name: "file_tag_id", referencedColumnName: "id"},
  })
  public file_tag_list: FileTag[];

  @TypeORM.ManyToOne(() => FileExtension, file_extension => file_extension.file_list, {nullable: false, onDelete: "RESTRICT", onUpdate: "CASCADE"})
  @TypeORM.JoinColumn({name: "file_extension_id"})
  public file_extension: FileExtension;
  public file_extension_id: string;

  @TypeORM.ManyToOne(() => User, user => user.file_created_list, {nullable: false})
  @TypeORM.JoinColumn({name: "user_created_id"})
  public user_created: User;
  public user_created_id: string;

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, select: false, default: null})
  public time_updated: Date;

  /**
   * Instance methods
   */

  public getFilePath() {
    return Path.resolve(process.env.FILE_PATH!, this.alias);
  }

  public toJSON(): FileJSON {
    return {
      id:             this.id,
      name:           this.name,
      size:           this.size,
      alias:          this.alias,
      file_extension: this.file_extension.toJSON(),
      file_tag_list:  _.map(this.file_tag_list, entity => entity.toJSON()),
      user_created:   this.user_created.toJSON(),
      time_created:   this.time_created,
      time_updated:   this.time_updated,
    };
  }

  /**
   * Utility methods
   */

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "user_created");
    this.join(query, "file_tag_list");
    this.join(query, "file_tag_list", "user_created");
    this.join(query, "file_extension");
    this.join(query, "file_extension", "file_type");
    return query;
  }

  public static addWhereID(query: TypeORM.SelectQueryBuilder<File>, id: string) {
    if (id.match(/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i)) {
      return query.andWhere(`${this.name}.id = :id`, {id});
    }
    else if (id.match(/^[a-zA-Z0-9-_]{16}$/)) {
      return query.andWhere(`${this.name}.alias = :id`, {id});
    }
    else {
      throw new ServerException(400, {id}, "ID or alias is malformed.");
    }
  }

  /**
   * Endpoint methods
   */

  @File.get("/")
  @File.bindParameter<Request.getFindMany>("name", ValidatorType.STRING, {max_length: 128})
  @File.bindParameter<Request.getFindMany>("file_type_list", ValidatorType.UUID, {flag_array: true})
  @File.bindParameter<Request.getFindMany>("file_tag_list", ValidatorType.UUID, {flag_array: true})
  @File.bindParameter<Request.getFindMany>("file_tag_set_operation", ValidatorType.ENUM, SetOperation)
  @File.bindPagination(100, ["id", "name", "size", "time_created"])
  public static async findMany({locals: {respond, user, parameters}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const {skip, limit, order, name, file_type_list, file_tag_list, file_tag_set_operation} = parameters!;
    const query = this.createPaginated({skip, limit, order});

    this.addWildcardClause(query, "name", name);
    this.addValueClause(query, "user_created", user?.id);
    this.addRelationClause(query, "file_extension", "file_type", file_type_list);
    this.addRelationSetClause(query, file_tag_set_operation ?? SetOperation.UNION, "file_tag_list", "id", file_tag_list);

    try {
      return respond?.(await query.getMany());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @File.get("/count")
  @File.bindParameter<Request.getFindMany>("name", ValidatorType.STRING, {max_length: 128})
  @File.bindParameter<Request.getFindMany>("file_type_list", ValidatorType.UUID, {flag_array: true})
  @File.bindParameter<Request.getFindMany>("file_tag_list", ValidatorType.UUID, {flag_array: true})
  @File.bindParameter<Request.getFindMany>("file_tag_set_operation", ValidatorType.ENUM, SetOperation)
  public static async count({locals: {respond, user, parameters}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    const {name, file_type_list, file_tag_list, file_tag_set_operation} = parameters!;
    const query = this.createSelect();

    this.addWildcardClause(query, "name", name);
    this.addValueClause(query, "user_created", user?.id);
    this.addRelationClause(query, "file_extension", "file_type", file_type_list);
    this.addRelationSetClause(query, file_tag_set_operation ?? SetOperation.UNION, "file_tag_list", "id", file_tag_list);

    try {
      return respond?.(await query.getCount());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @File.get("/:id")
  public static async findOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.getFindOne, Request.getFindOne>) {
    const query = this.createSelect();

    this.addWhereID(query, id);
    this.addValueClause(query, "user_created", user?.id);

    try {
      return respond?.(await query.getOneOrFail());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @File.get("/data/:id", {user: false})
  public static async readOne({params: {id}, locals: {respond}}: Server.Request<{id: string}, Response.getReadOne, Request.getReadOne>, response: Server.Response) {
    const where = {} as TypeORM.ObjectLiteral;

    if (id.match(/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i)) {
      where.id = id;
    }
    else if (id.match(/^[a-zA-Z0-9-_]{16}$/)) {
      where.alias = id;
    }
    else {
      return respond?.(new ServerException(400, {where}, "ID or alias is malformed."));
    }

    try {
      const file = await this.createSelect().where(where).getOneOrFail();
      response.setHeader("Content-Type", file.file_extension.mime_type);
      response.setHeader("Content-Disposition", `attachment; filename="filename.jpg"`);
      response.sendFile(Path.resolve(process.env.FILE_PATH!, file.alias));
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @File.post("/")
  @File.bindParameter<Request.postCreateOne>("file", ValidatorType.FILE)
  @File.bindParameter<Request.postCreateOne>("file_tag_list", ValidatorType.UUID, {flag_array: true, flag_optional: true})
  private static async createOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {file, file_tag_list} = parameters!;

    if (file.originalname.length > 128) {
      return respond?.(new ServerException(400, {name: file.originalname}, "File name can only by 128 characters long."));
    }

    const entity = TypeORM.getRepository(File).create();
    entity.id = v4();
    entity.name = file.originalname;
    entity.alias = NanoID();
    entity.size = file.size;
    entity.user_created = user!;

    try {
      const {id} = await FileType.createSelect().where({name: file.mimetype.split("/")[0]}).getOneOrFail();
      entity.file_extension = await FileExtension.createSelect().where({file_type: id, mime_type: file.mimetype}).getOneOrFail();
    }
    catch (error) {
      return respond?.(new ServerException(400, {mime_type: file.mimetype}, "File MIME type is not accepted"));
    }

    FS.rename(file.path, entity.getFilePath(), async error => {
      if (error) return respond?.(new ServerException(500, {from: file.path, to: entity.getFilePath()}, "Error while moving file"));

      try {
        _.merge(entity, await this.performInsert(entity));
      }
      catch (error) {
        return respond?.(error);
      }

      try {
        entity.file_tag_list = await FileTag.performSelect(file_tag_list ?? []);
        await this.createRelation(File, "file_tag_list").of(entity.id).add(entity.file_tag_list);
        return respond?.(entity);
      }
      catch (error) {
        return respond?.(error);
      }
    });
  }

  @File.post("/request-download")
  @File.bindParameter<Request.postRequestDownload>("id", ValidatorType.UUID, {flag_array: true})
  private static async requestDownload({locals: {respond, user, parameters}}: Server.Request<{}, Response.postRequestDownload, Request.postRequestDownload>, response: Server.Response) {
    const {id} = parameters!;

    const files = await this.performSelect(id);
    const hash = Crypto.createHash("sha256");

    const archive = new ADMZip();
    for (let file of files) {
      const name = file.name.match(new RegExp(`${file.file_extension.name}$`)) ? file.name : `${file.name}.${file.file_extension.name}`;
      hash.update(file.alias);
      archive.addLocalFile(file.getFilePath(), "", name);
    }

    const token = hash.digest("hex");
    const path = Path.resolve(process.env.TEMP!, token);
    archive.writeZip(path, error => {
      if (error) return respond?.(new ServerException(500, error, error.message));
      respond?.(token);
    });
  }

  @File.post("/confirm-download", {user: false})
  @File.bindParameter<Request.postConfirmDownload>("token", ValidatorType.STRING)
  private static async confirmDownload({locals: {respond, user, parameters}}: Server.Request<{}, Response.postConfirmDownload, Request.postConfirmDownload>, response: Server.Response) {
    const {token} = parameters!;
    const path = Path.resolve(process.env.TEMP!, token);
    const name = `files_${Moment().format("YYYY_MM_DD_H_m_s")}.zip`;
    response.download(path, name, {}, () => FS.unlink(path, (error) => (error && error.code !== "ENOENT") && Logger.write(Logger.Level.ERROR, error)));
  }

  @File.put("/:id", {permission: PermissionLevel.FILE_UPDATE})
  @File.bindParameter<Request.putUpdateOne>("name", ValidatorType.STRING, {min_length: 3}, {flag_optional: true})
  @File.bindParameter<Request.putUpdateOne>("file_extension", ValidatorType.UUID, {flag_optional: true})
  @File.bindParameter<Request.putUpdateOne>("file_tag_list", ValidatorType.UUID, {flag_array: true, flag_optional: true})
  private static async updateOne({params: {id}, locals: {respond, user, parameters}}: Server.Request<{id: string}, Response.putUpdateOne, Request.putUpdateOne>) {
    const {name, file_extension, file_tag_list} = parameters!;

    try {
      const {file_tag_list: current_file_tag_list, ...file} = await File.performSelect(id);
      if (file.user_created.id !== user?.id) return respond?.(new ServerException(403));

      if (file_tag_list) {
        const file_tag_id_list = _.map(current_file_tag_list, file_tag => file_tag.id);
        const file_tag_add_list = _.differenceWith(file_tag_list, file_tag_id_list, (a, b) => a === b);
        const file_tag_remove_list = _.differenceWith(file_tag_id_list, file_tag_list, (a, b) => a === b);

        await this.createRelation(File, "file_tag_list").of(file.id).remove(file_tag_remove_list);
        await this.createRelation(File, "file_tag_list").of(file.id).add(file_tag_add_list);
      }

      if (name) file.name = name;
      if (file_extension) file.file_extension = await FileExtension.performSelect(file_extension);

      respond?.(await this.performUpdate(id, file));
    }
    catch (error) {
      respond?.(new ServerException(500, error));
    }
  }

  @File.delete("/:id", {permission: PermissionLevel.FILE_DELETE})
  private static async deleteOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.deleteDeleteOne, Request.deleteDeleteOne>) {
    const query = this.createSelect();
    this.addValueClause(query, "id", id);

    try {
      const file = await query.getOneOrFail();
      if (file.user_created.id !== user?.id) return respond?.(new ServerException(403));

      FS.unlink(Path.resolve(process.env.FILE_PATH!, file.alias), async error => {
        if (error) return respond?.(new ServerException(500, error));

        try {
          respond?.(await this.performDelete(file.id));
        }
        catch (error) {
          respond?.(new ServerException(500, error));
        }
      });
    }
    catch (error) {
      if (error instanceof TypeORM.EntityNotFoundError) return respond?.(new ServerException(404));
      respond?.(new ServerException(500, error));
    }
  }
}


export type FileJSON = {
  id: string
  alias: string
  name: string
  size: number
  file_extension: FileExtensionJSON
  file_tag_list: FileTagJSON[]
  user_created: UserJSON
  time_created: Date
  time_updated: Date
}

namespace Request {
  export type getFindMany = getCount & Pagination
  export type getCount = {name?: string; file_type_list?: string[]; file_tag_list?: string[]; file_tag_set_operation?: SetOperation}
  export type getFindOne = never
  export type getReadOne = never
  export type postCreateOne = {file: FileHandle; file_tag_list?: string[]}
  export type postRequestDownload = {id: string[]}
  export type postConfirmDownload = {token: string}
  export type putUpdateOne = {name?: string; file_extension?: string; file_tag_list?: string[]}
  export type deleteDeleteOne = never
}

namespace Response {
  export type getFindMany = File[] | ServerException
  export type getCount = number | ServerException
  export type getFindOne = File | ServerException
  export type getReadOne = ServerException
  export type postCreateOne = File | ServerException
  export type postRequestDownload = string | ServerException
  export type postConfirmDownload = string | ServerException
  export type putUpdateOne = File | ServerException
  export type deleteDeleteOne = File | ServerException
}
