import {Collection, Entity, Enum, FilterQuery, Index, ManyToMany, ManyToOne, PrimaryKey, Property, Unique} from "@mikro-orm/core";
import ADMZip from "adm-zip";
import * as FS from "fs";
import JWT from "jsonwebtoken";
import Moment from "moment";
import Path from "path";
import {v4} from "uuid";
import DatabaseEntity, {CountOptions, FindManyOptions, Pagination} from "../../../common/classes/Entity/DatabaseEntity";
import FileHandle from "../../../common/classes/File/FileHandle";
import FileTypeName from "../../../common/enums/FileTypeName";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import Privacy from "../../../common/enums/Privacy";
import SetOperation from "../../../common/enums/SetOperation";
import ValidatorType from "../../../common/enums/ValidatorType";
import ServerException from "../../../common/exceptions/ServerException";
import Logger from "../../../common/services/Logger";
import Server from "../../../common/services/Server";
import User from "../User";
import FileExtension from "./FileExtension";
import FileTag from "./FileTag";

@Entity()
@Unique({name: "data_hash", properties: ["data_hash"] as (keyof File)[]})
@Index({name: "time_created", properties: ["time_created"] as (keyof File)[]})
@Index({name: "time_updated", properties: ["time_updated"] as (keyof File)[]})
export default class File extends DatabaseEntity<File>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string;

  @Property({length: 128})
  public name: string;

  @Property()
  public size: number;

  @Enum(() => Privacy)
  public privacy: Privacy;

  @Property({length: 64})
  public data_hash: string

  @Property({length: 32})
  public share_hash: string

  @Property({type: "boolean"})
  public flag_public_tag_list: boolean;

  @ManyToOne(() => FileExtension)
  public file_extension: FileExtension;

  @ManyToMany(() => FileTag)
  public file_tag_list: Collection<FileTag>;

  @ManyToOne(() => User)
  public user: User;

  @Property()
  public time_created: Date;

  @Property({onUpdate: () => new Date(), nullable: true})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  public getFullName() {
    return this.name.match(new RegExp(`${this.file_extension.name}$`)) ? this.name : `${this.name}.${this.file_extension.name}`;
  }

  public getFilePath() {
    return Path.resolve(process.env.FILE_PATH!, this.data_hash);
  }

  public hasAccess(user: User, share_hash?: string) {
    return user?.id === this.user.id || this.privacy === Privacy.PUBLIC || this.privacy === Privacy.LINK && this.share_hash === share_hash;
  }

  //endregion ----- Instance methods -----

  //region    ----- Static properties -----

  //endregion ----- Static properties -----

  //region    ----- Endpoint methods -----

  @File.get("/count", {user: true})
  @File.bindParameter<Request.getMany>("name", ValidatorType.STRING, {max_length: 128})
  @File.bindParameter<Request.getMany>("file_type_list", ValidatorType.ENUM, FileTypeName, {array: true})
  @File.bindParameter<Request.getMany>("file_tag_list", ValidatorType.UUID, {array: true})
  @File.bindParameter<Request.getMany>("file_tag_set_operation", ValidatorType.ENUM, SetOperation)
  public static async getCount({locals: {respond, user, params: {name, file_type_list, file_tag_list, file_tag_set_operation}}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    const where: FilterQuery<File> = {user};
    if (name) where.name = {$like: `%${name}%`};
    if (file_tag_list) where.file_tag_list = {id: file_tag_list};
    if (file_type_list) where.file_extension = {type: file_type_list};

    const options: CountOptions<File> = {};
    if (file_tag_set_operation === SetOperation.INTERSECTION) {
      options.groupBy = `(${this.getMetadata().properties["file_tag_list" as keyof File].joinColumns.join("), (")})`;
      options.having = `COUNT(*) = ${file_tag_list.length}`;
    }

    return respond(await this.getRepository().count(where, options));
  }

  @File.get("/", {user: true})
  @File.bindParameter<Request.getMany>("name", ValidatorType.STRING, {max_length: 128})
  @File.bindParameter<Request.getMany>("file_type_list", ValidatorType.ENUM, FileTypeName, {array: true})
  @File.bindParameter<Request.getMany>("file_tag_list", ValidatorType.UUID, {array: true})
  @File.bindParameter<Request.getMany>("file_tag_set_operation", ValidatorType.ENUM, SetOperation)
  @File.bindPagination(100, ["id", "name", "size", "time_created"])
  public static async getMany({locals: {respond, user, params: {name, file_type_list, file_tag_list, file_tag_set_operation, ...pagination}}}: Server.Request<{}, Response.getMany, Request.getMany>) {
    const where: FilterQuery<File> = {user};
    if (name) where.name = {$like: `%${name}%`};
    if (file_tag_list) where.file_tag_list = {id: file_tag_list};
    if (file_type_list) where.file_extension = {type: file_type_list};

    const options: FindManyOptions<File> = {...pagination};
    if (file_tag_set_operation === SetOperation.INTERSECTION) {
      options.groupBy = `(${this.getMetadata().properties["file_tag_list" as keyof File].joinColumns.join("), (")})`;
      options.having = `COUNT(*) = ${file_tag_list.length}`;
    }

    return respond(await this.getRepository().populate(await this.getRepository().find(where, options), ["file_extension", "file_tag_list", "user"]));
  }

  @File.get("/:id", {user: false})
  @File.bindParameter<Request.getOne>("share_hash", ValidatorType.STRING, {min_length: 32, max_length: 32})
  public static async getOne({params: {id}, locals: {respond, user, params: {share_hash}}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    const file_entity = await this.getRepository().findOneOrFail(
      {
        id,
        $or: [
          {privacy: Privacy.PUBLIC},
          {privacy: Privacy.LINK, share_hash},
          {privacy: Privacy.PRIVATE, user},
        ],
      },
      {populate: ["file_extension", "file_tag_list", "user"]},
    );

    if (file_entity.user.id !== user?.id && !file_entity.flag_public_tag_list) {
      file_entity.file_tag_list.removeAll();
    }

    return respond(file_entity);
  }

  @File.get("/data/:data_hash", {user: false})
  public static async getData({params: {data_hash}, locals: {respond, user}}: Server.Request<{data_hash: string}, Response.getData, Request.getData>, response: Server.Response) {
    const file = await File.getRepository().findOneOrFail({data_hash}, {populate: ["user", "file_extension"]});

    response.setHeader("Content-Type", file.file_extension.mime_type);
    response.sendFile(Path.resolve(process.env.FILE_PATH!, file.data_hash));
  }

  @File.post("/")
  @File.bindParameter<Request.postOne>("data", ValidatorType.FILE)
  @File.bindParameter<Request.postOne>("privacy", ValidatorType.ENUM, Privacy, {optional: true})
  @File.bindParameter<Request.postOne>("flag_public_tag_list", ValidatorType.ENUM, Privacy, {optional: true})
  @File.bindParameter<Request.postOne>("file_tag_list", ValidatorType.UUID, {array: true, optional: true})
  private static async createOne({locals: {respond, user, params: {data, privacy, file_tag_list, flag_public_tag_list}}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    if (data.name.length > 128) {
      return respond(new ServerException(400, {name: data.name}, "File name can only by 128 characters long."));
    }

    const file = this.getRepository().create({
      id:                   v4(),
      name:                 data.name,
      size:                 data.size,
      privacy:              privacy ?? Privacy.PRIVATE,
      user:                 user,
      data_hash:            File.generateDataHash(),
      share_hash:           File.generateShareHash(),
      flag_public_tag_list: flag_public_tag_list ?? false,
      file_extension:       await FileExtension.getRepository().findOneOrFail({name: data.extension, mime_type: data.mime_type, type: data.file_type}),
      file_tag_list:        await FileTag.getRepository().find({user, id: file_tag_list}),
      time_created:         new Date(),
      time_updated:         null,
    });

    FS.rename(data.path, file.getFilePath(), async error => {
      if (error) return respond(new ServerException(500, {from: data.path, to: file.getFilePath()}, "Error while moving file"));

      await this.getRepository().persist(file);
      return respond(file);
    });
  }

  @File.post("/request-download")
  @File.bindParameter<Request.postDownloadRequest>("id", ValidatorType.UUID, {array: true})
  @File.bindParameter<Request.postDownloadRequest>("share_hash", ValidatorType.STRING, {validator: File.regexShareHash}, {array: true, optional: true})
  private static async requestDownload({locals: {respond, user, params: {id, share_hash}}}: Server.Request<{}, Response.postRequestDownload, Request.postDownloadRequest>) {
    const file_list = await this.getRepository().find({id});
    if (!file_list.every(file => file.hasAccess(user!, share_hash))) return respond(new ServerException(403, {id}));

    return respond(JWT.sign({id}, `${process.env["FILE_SECRET"]}:${id.join(":")}`, {algorithm: "HS256", expiresIn: "1m"}));
  }

  @File.post("/confirm-download", {user: false})
  @File.bindParameter<Request.postDownloadConfirm>("token", ValidatorType.STRING)
  private static async confirmDownload({locals: {respond, params}}: Server.Request<{}, Response.postConfirmDownload, Request.postDownloadConfirm>, response: Server.Response) {
    const {token} = params!;
    const {id} = JWT.decode(token) as {id: string[]};
    try {
      await JWT.verify(token, `${process.env["FILE_SECRET"]}:${id.join(":")}`);

      const file_list = await this.getRepository().find({id});
      if (file_list.length === 1) {
        const path = Path.resolve(process.env.FILE_PATH!, file_list[0].getFilePath());
        return response.download(path, file_list[0].getFullName(), err => err && respond(new ServerException(500, err)));
      }

      const archive = new ADMZip();
      for (let file of file_list) archive.addLocalFile(file.getFilePath(), "", file.getFullName());

      const name = `files_${Moment().format("YYYY_MM_DD_H_m_s")}.zip`;
      const path = Path.resolve(process.env.TEMP!, v4());

      archive.writeZip(path, error => {
        if (error) return respond(new ServerException(500, error, error.message));

        response.download(path, name, error => {
          if (error) respond(new ServerException(500, error));

          FS.unlink(path, error => {
            if (!error || error.code === "ENOENT") return;

            Logger.write(Logger.Level.ERROR, error);
          });
        });
      });
    }
    catch (error) {
      respond(new ServerException(500, error));
    }
  }

  @File.put("/:id", {permission: PermissionLevel.FILE_UPDATE})
  @File.bindParameter<Request.putOne>("name", ValidatorType.STRING, {}, {optional: true})
  @File.bindParameter<Request.putOne>("privacy", ValidatorType.ENUM, Privacy, {optional: true})
  @File.bindParameter<Request.putOne>("flag_public_tag", ValidatorType.BOOLEAN, {optional: true})
  @File.bindParameter<Request.putOne>("file_extension", ValidatorType.UUID, {optional: true})
  @File.bindParameter<Request.putOne>("file_tag_list", ValidatorType.UUID, {array: true, optional: true})
  private static async updateOne({params: {id}, locals: {respond, user, params}}: Server.Request<{id: string}, Response.putOne, Request.putOne>) {
    const {name, privacy, flag_public_tag, file_extension, file_tag_list} = params!;
    const file = await this.getRepository().findOneOrFail({id, user}, {populate: ["file_extension", "file_tag_list", "user"]});

    if (name !== undefined) file.name = name;
    if (privacy !== undefined) file.privacy = privacy;
    if (flag_public_tag !== undefined) file.flag_public_tag_list = flag_public_tag;
    if (file_extension !== undefined) file.file_extension = await FileExtension.getRepository().findOneOrFail(file_extension);
    if (file_tag_list?.length) file.file_tag_list.set(await FileTag.getRepository().find({id: file_tag_list}));
    await this.getRepository().persist(file);

    return respond(file);
  }

  @File.delete("/:id", {permission: PermissionLevel.FILE_DELETE})
  private static async deleteOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.deleteOne, Request.deleteOne>) {
    const file = await this.getRepository().findOneOrFail({id, user}, {populate: ["file_extension", "file_tag_list", "user"]});

    FS.unlink(Path.resolve(process.env.FILE_PATH!, file.data_hash), async error => {
      if (error) return respond(new ServerException(500, error));

      await this.getRepository().remove(file);
      return respond(file);
    });
  }

  //endregion ----- Endpoint methods -----

}

namespace Request {
  export type getMany = getCount & Pagination
  export type getCount = {name?: string; file_type_list: string[]; file_tag_list: string[]; file_tag_set_operation?: SetOperation}
  export type getOne = {share_hash?: string}
  export type getData = never
  export type postOne = {data: FileHandle; privacy?: Privacy; flag_public_tag_list?: boolean; file_tag_list?: string[]}
  export type postDownloadRequest = {id: string[], share_hash?: string}
  export type postDownloadConfirm = {token: string}
  export type putOne = {name?: string; file_extension?: string; file_tag_list?: string[], privacy?: Privacy, flag_public_tag?: boolean}
  export type deleteOne = never
}

namespace Response {
  export type getMany = File[] | ServerException
  export type getCount = number | ServerException
  export type getOne = File | ServerException
  export type getData = ServerException
  export type postOne = File | ServerException
  export type postRequestDownload = string | ServerException
  export type postConfirmDownload = string | ServerException
  export type putOne = File | ServerException
  export type deleteOne = File | ServerException
}
