import * as _ from "lodash";
import * as TypeORM from "typeorm";
import Entity, {Pagination} from "../../../common/classes/Entity";
import ValidatorType from "../../../common/enums/ValidatorType";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";
import User, {UserJSON} from "../User";
import Privacy from "../../../common/enums/Privacy";

@TypeORM.Entity()
@TypeORM.Unique("name", ["name"] as (keyof Page)[])
@TypeORM.Unique("path", ["path"] as (keyof Page)[])
export default class Page extends Entity<Page>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 64})
  public name: string;

  @TypeORM.Column({type: "varchar", length: 256})
  public path: string;

  @TypeORM.Column({type: "enum", enum: Privacy})
  public privacy: Privacy;

  @TypeORM.Column({type: "text"})
  public content: string;

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
      name:         this.name,
      content:      this.content,
      user_created: this.user_created.toJSON(),
      time_created: this.time_created,
      time_updated: this.time_updated,
    };
  }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "user_created");
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
      return respond?.(error);
    }
  }

  @Page.post("/")
  @Page.bindParameter<Request.postCreateOne>("name", ValidatorType.STRING, {min_length: 1})
  @Page.bindParameter<Request.postCreateOne>("content", ValidatorType.STRING, {min_length: 1})
  private static async createOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {name, content} = parameters!;
    const entity = TypeORM.getRepository(this).create();

    entity.name = name;
    entity.content = content;
    entity.user_created = user!;

    try {
      return respond?.(await this.performInsert(entity));
    }
    catch (error) {
      if (error.code === "ER_DUP_ENTRY") return respond?.(new ServerException(409, {name}));
      return respond?.(error);
    }
  }

  @Page.put("/:id")
  @Page.bindParameter<Request.putUpdateOne>("name", ValidatorType.STRING, {min_length: 1}, {flag_optional: true})
  @Page.bindParameter<Request.putUpdateOne>("content", ValidatorType.STRING, {min_length: 1}, {flag_optional: true})
  private static async updateOne({params: {id}, locals: {respond, user, parameters}}: Server.Request<{id: string}, Response.putUpdateOne, Request.putUpdateOne>) {
    const {name, content} = parameters!;
    const entity = TypeORM.getRepository(this).create();

    try {
      const page = await this.performSelect(id);
      if (page.user_created.id !== user?.id) return respond?.(new ServerException(403));

      if (name !== undefined) entity.name = name;
      if (content !== undefined) entity.content = content;

      return respond?.(await this.performUpdate(id, _.pickBy(entity)));
    }
    catch (error) {
      if (error.code === "ER_DUP_ENTRY") return respond?.(new ServerException(409, {name}));
      return respond?.(error);
    }
  }

  //endregion ----- Endpoint methods -----

}

export type PageJSON = {
  id: string
  name: string
  content: string
  user_created: UserJSON
  time_created: Date
  time_updated: Date
}

namespace Request {
  export type getCount = {name?: string}
  export type getFindMany = getCount & Pagination
  export type getFindOne = never
  export type postCreateOne = {name: string, content: string}
  export type putUpdateOne = {name?: string, content?: string}
}

namespace Response {
  export type getCount = number | ServerException
  export type getFindMany = Page[] | ServerException
  export type getFindOne = Page | ServerException
  export type postCreateOne = Page | ServerException
  export type putUpdateOne = Page | ServerException
}

