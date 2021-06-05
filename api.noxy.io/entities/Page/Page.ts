import * as _ from "lodash";
import * as TypeORM from "typeorm";
import Entity, {Pagination} from "../../../common/classes/Entity";
import ValidatorType from "../../../common/enums/ValidatorType";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";
import User, {UserJSON} from "../User";
import Privacy from "../../../common/enums/Privacy";
import File, {FileJSON} from "../File/File";

@TypeORM.Entity()
@TypeORM.Unique("name", ["name"] as (keyof Page)[])
@TypeORM.Unique("path", ["path"] as (keyof Page)[])
export default class Page extends Entity<Page>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 256})
  public path: string;

  @TypeORM.Column({type: "varchar", length: 64})
  public name: string;

  @TypeORM.Column({type: "text"})
  public content: string;

  @TypeORM.Column({type: "enum", enum: Privacy})
  public privacy: Privacy;

  @TypeORM.Column({type: "varchar", length: 32})
  public share_hash: string;

  @TypeORM.ManyToMany(() => File, entity => entity.page_list)
  @TypeORM.JoinTable({
    name:              `jct/page-file`,
    joinColumn:        {name: "page_id", referencedColumnName: "id"},
    inverseJoinColumn: {name: "file_id", referencedColumnName: "id"},
  })
  public file_list: File[];

  @TypeORM.ManyToOne(() => User, user => user.page_created_list, {nullable: false})
  @TypeORM.JoinColumn({name: "user_created_id"})
  public user_created: User;

  @TypeORM.Column({type: "varchar", length: 36})
  public user_created_id: string;

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, default: null})
  public time_updated: Date;

  //endregion ----- Properties -----


  //region    ----- Instance methods -----

  public toJSON(): PageJSON {
    return {
      id:           this.id,
      path:         this.path,
      name:         this.name,
      content:      this.content,
      privacy:      this.privacy,
      file_list:    this.file_list?.map(entity => entity.toJSON()),
      share_hash:   this.share_hash,
      user_created: this.user_created?.toJSON() ?? this.user_created_id,
      time_created: this.time_created,
      time_updated: this.time_updated,
    };
  }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "user_created");
    this.join(query, "file_list");
    return query;
  }

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @Page.get("/")
  @Page.bindParameter<Request.getCount>("name", ValidatorType.STRING, {min_length: 0})
  @Page.bindPagination(100, ["id", "name", "time_created"])
  public static async findMany({locals: {respond, user, parameters}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const {skip, limit, order, name} = parameters!;
    const query = this.createPaginated({skip, limit, order});

    this.addWildcardClause(query, "name", name);
    this.addValueClause(query, "user_created", user?.id);

    try {
      return respond?.(await query.getMany());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @Page.get("/count")
  @Page.bindParameter<Request.getCount>("name", ValidatorType.STRING, {min_length: 0})
  public static async count({locals: {respond, user, parameters}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    const {name} = parameters!;
    const query = this.createSelect();

    this.addWildcardClause(query, "name", name);
    this.addValueClause(query, "user_created", user?.id);

    try {
      return respond?.(await query.getCount());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @Page.get("/:id")
  public static async findOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.getFindOne, Request.getFindOne>) {
    try {
      const entity = await this.performSelect(id);
      if (entity.user_created.id !== user!.id) return respond?.(new ServerException(403, {id}));
      return respond?.(entity);
    }
    catch (error) {
      if (error instanceof TypeORM.EntityNotFoundError) return respond?.(new ServerException(404, {id}));
      return respond?.(error);
    }
  }

  @Page.get("/by-path/:path")
  public static async findOneByPath({params: {path}, locals: {respond, user}}: Server.Request<{path: string}, Response.getFindOne, Request.getFindOne>) {
    const query = this.createSelect();

    try {
      this.addValueClause(query, "path", path);
      const entity = await query.getOneOrFail();

      if (entity.user_created.id !== user!.id) return respond?.(new ServerException(403, {path}));
      return respond?.(entity);
    }
    catch (error) {
      if (error instanceof TypeORM.EntityNotFoundError) return respond?.(new ServerException(404, {path}));
      return respond?.(error);
    }
  }

  @Page.post("/")
  @Page.bindParameter<Request.postCreateOne>("path", ValidatorType.STRING, {min_length: 1})
  @Page.bindParameter<Request.postCreateOne>("name", ValidatorType.STRING, {min_length: 1})
  @Page.bindParameter<Request.postCreateOne>("content", ValidatorType.STRING, {min_length: 1})
  @Page.bindParameter<Request.postCreateOne>("privacy", ValidatorType.ENUM, Privacy, {flag_optional: true})
  @Page.bindParameter<Request.postCreateOne>("file_list", ValidatorType.UUID, {flag_array: true, flag_optional: true})
  private static async createOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {name, path, content, privacy, file_list} = parameters!;
    const entity = TypeORM.getRepository(this).create();

    entity.name = name;
    entity.path = path;
    entity.content = content;
    entity.privacy = privacy ?? Privacy.PRIVATE;
    entity.share_hash = File.generateShareHash();
    entity.user_created = user!;

    try {
      const inserted = await this.performInsert(entity);

      if (file_list) {
        await this.createRelation(Page, "file_list").of(inserted.id).add(file_list);
      }

      return respond?.(inserted);
    }
    catch (error) {
      if (error.code === "ER_DUP_ENTRY") return respond?.(new ServerException(409, {name}));
      return respond?.(error);
    }
  }

  @Page.put("/:id")
  @Page.bindParameter<Request.putUpdateOne>("path", ValidatorType.STRING, {min_length: 1}, {flag_optional: true})
  @Page.bindParameter<Request.putUpdateOne>("name", ValidatorType.STRING, {min_length: 1}, {flag_optional: true})
  @Page.bindParameter<Request.putUpdateOne>("content", ValidatorType.STRING, {min_length: 1}, {flag_optional: true})
  @Page.bindParameter<Request.putUpdateOne>("privacy", ValidatorType.ENUM, Privacy, {flag_optional: true})
  @Page.bindParameter<Request.putUpdateOne>("file_list", ValidatorType.UUID, {flag_array: true, flag_optional: true})
  private static async updateOne({params: {id}, locals: {respond, user, parameters}}: Server.Request<{id: string}, Response.putUpdateOne, Request.putUpdateOne>) {
    const {name, path, content, privacy, file_list} = parameters!;

    try {
      const entity = await this.performSelect(id);
      if (entity.user_created.id !== user?.id) return respond?.(new ServerException(403));

      if (path !== undefined) entity.path = path;
      if (name !== undefined) entity.name = name;
      if (content !== undefined) entity.content = content;
      if (privacy !== undefined) entity.privacy = privacy;

      if (file_list) {
        const file_tag_id_list = _.map(entity.file_list, file => file.id);
        const file_add_list = _.differenceWith(file_list, file_tag_id_list, (a, b) => a === b);
        const file_remove_list = _.differenceWith(file_tag_id_list, file_list, (a, b) => a === b);

        await this.createRelation(Page, "file_list").of(entity.id).remove(file_remove_list);
        await this.createRelation(Page, "file_list").of(entity.id).add(file_add_list);
      }

      return respond?.(await this.performUpdate(id, entity));
    }
    catch (error) {
      return respond?.(error);
    }
  }

  //endregion ----- Endpoint methods -----

}

export type PageJSON = {
  id: string
  path: string
  name: string
  content: string
  privacy: Privacy
  file_list?: FileJSON[]
  share_hash: string
  user_created: UserJSON
  time_created: Date
  time_updated: Date
}

namespace Request {
  export type getCount = {name?: string}
  export type getFindMany = getCount & Pagination
  export type getFindOne = never
  export type postCreateOne = {path: string; name: string; content: string; privacy?: Privacy; file_list?: string[]}
  export type putUpdateOne = {path?: string; name?: string; content?: string; privacy?: Privacy; file_list?: string[]}
}

namespace Response {
  export type getCount = number | ServerException
  export type getFindMany = Page[] | ServerException
  export type getFindOne = Page | ServerException
  export type postCreateOne = Page | ServerException
  export type putUpdateOne = Page | ServerException
}

