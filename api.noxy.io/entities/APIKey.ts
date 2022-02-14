import JWT from "jsonwebtoken";
import {v4} from "uuid";
import Permission from "../../common/classes/Permission";
import ValidatorType from "../../common/enums/ValidatorType";
import PermissionLevel from "../../common/enums/PermissionLevel";
import DatabaseEntity, {Pagination} from "../../common/classes/Entity/DatabaseEntity";
import ServerException from "../../common/exceptions/ServerException";
import User from "./User";
import Server from "../../common/services/Server";
import {PrimaryKey, Entity, Property, ManyToOne, Index, Unique} from "@mikro-orm/core";
import PermissionType from "../../common/type/PermissionType";

@Entity()
@Unique({name: "token", properties: ["token"] as (keyof APIKey)[]})
@Index({name: "time_created", properties: ["time_created"] as (keyof APIKey)[]})
@Index({name: "time_updated", properties: ["time_updated"] as (keyof APIKey)[]})
export default class APIKey extends DatabaseEntity<APIKey>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string;

  @Property({length: 230})
  public token: string;

  @Property({type: PermissionType})
  public permission: Permission;

  @Property()
  public limit_per_decasecond: number;

  @Property()
  public limit_per_minute: number;

  @ManyToOne(() => User, {length: 36, onDelete: "cascade"})
  public user: User;

  @Property()
  public time_created: Date;

  @Property({onUpdate: () => new Date(), nullable: true})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  public secure(current_user?: boolean) {
    if (current_user) return this;
    return Object.assign(new APIKey(), this, {token: undefined} as Initializer<User>);
  }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  public static generateToken(id: string = v4()) {
    return JWT.sign({id}, process.env.JWT_SECRET!, {algorithm: "HS512", expiresIn: "7d"});
  }

  //endregion ----- Utility methods -----

  //region    ----- Static properties -----

  //endregion ----- Static properties -----

  //region    ----- Endpoint methods -----

  @APIKey.get("/count", {permission: PermissionLevel.API_KEY_VIEW})
  @APIKey.bindParameter("name", ValidatorType.STRING, {max_length: 64})
  private static async getCount({locals: {respond, user}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    return respond(await this.getRepository().count({user}));
  }

  @APIKey.get("/", {permission: PermissionLevel.API_KEY_VIEW})
  @APIKey.bindPagination(100, ["id", "time_created"])
  public static async getMany({locals: {respond, user, api_key, params}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const list = await this.getRepository().find({user}, {limit: params.limit, offset: params.skip, orderBy: params.order, populate: ["user"]});
    return respond(list.map(entity => entity.secure(entity.user.id === api_key.user.id)));
  }

  @APIKey.get("/:id", {permission: PermissionLevel.API_KEY_VIEW})
  public static async getOne({params: {id}, locals: {respond, user, api_key}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    const entity = await this.getRepository().findOneOrFail({id, user}, {populate: ["user"]});
    return respond(entity.secure(entity.user.id === api_key.user.id));
  }

  @APIKey.post("/", {permission: [PermissionLevel.API_KEY_CREATE]})
  @APIKey.bindParameter<Request.postOne>("permission", ValidatorType.STRING)
  @APIKey.bindParameter<Request.postOne>("limit_per_decasecond", ValidatorType.INTEGER, {min: 0})
  @APIKey.bindParameter<Request.postOne>("limit_per_minute", ValidatorType.INTEGER, {min: 0})
  private static async postOne({locals: {respond, user, api_key, params}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    const id = v4();
    const api_key_entity = this.getRepository().create({
      id:                   id,
      token:                APIKey.generateToken(id),
      permission:           new Permission(JSON.parse(params.permission)),
      limit_per_decasecond: params.limit_per_decasecond,
      limit_per_minute:     params.limit_per_minute,
      user:                 user,
      time_created:         new Date(),
      time_updated:         null,
    });
    await this.getRepository().persist(api_key_entity);

    return respond(api_key_entity.secure(api_key_entity.user.id === api_key.user.id));
  }

  @APIKey.put("/:id", {permission: PermissionLevel.API_KEY_UPDATE})
  @APIKey.bindParameter<Request.putOne>("permission", ValidatorType.STRING)
  @APIKey.bindParameter<Request.putOne>("limit_per_decasecond", ValidatorType.INTEGER, {min: 0})
  @APIKey.bindParameter<Request.putOne>("limit_per_minute", ValidatorType.INTEGER, {min: 0})
  private static async putOne({params: {id}, locals: {respond, user, api_key, params}}: Server.Request<{id: string}, Response.putOne, Request.putOne>) {
    const entity = await this.getRepository().findOneOrFail({id, user}, {populate: ["user"]});
    entity.limit_per_minute = params.limit_per_minute;
    entity.limit_per_decasecond = params.limit_per_decasecond;
    entity.permission = new Permission(JSON.parse(params.permission));
    await this.getRepository().persist(entity);

    return respond(entity.secure(entity.user?.id === api_key.user.id));
  }

  @APIKey.delete("/:id", {permission: PermissionLevel.API_KEY_DELETE})
  private static async deleteOne({params: {id}, locals: {respond, user, api_key}}: Server.Request<{id: string}, Response.deleteOne, Request.deleteOne>) {
    const count = await this.getRepository().count({user});
    if (count === 1) {
      return respond(new ServerException(400, {}, "A user must always have at least one API Key, please create a new one before deleting this."));
    }

    const api_key_entity = await this.getRepository().findOneOrFail({id, user});
    await this.getRepository().remove(api_key_entity);

    return respond(api_key_entity.secure(api_key_entity.user.id === api_key.user.id));
  }

  //endregion ----- Endpoint methods -----

}

namespace Request {
  export type getFindMany = getCount & Pagination
  export type getCount = {user: string | string[]; search: string}
  export type getOne = never
  export type postOne = {user: string; permission: string; limit_per_decasecond: number; limit_per_minute: number}
  export type putOne = {permission: string; limit_per_decasecond: number; limit_per_minute: number}
  export type deleteOne = {id: string}
}

namespace Response {
  export type getFindMany = APIKey[] | ServerException
  export type getCount = number
  export type getOne = APIKey | ServerException
  export type postOne = APIKey | ServerException
  export type putOne = APIKey | ServerException
  export type deleteOne = APIKey | ServerException
}

