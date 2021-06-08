import JWT from "jsonwebtoken";
import * as TypeORM from "typeorm";
import {v4} from "uuid";
import Permission from "../../common/classes/Permission";
import ValidatorType from "../../common/enums/ValidatorType";
import PermissionLevel from "../../common/enums/PermissionLevel";
import Entity, {Pagination} from "../../common/classes/Entity";
import ServerException from "../../common/exceptions/ServerException";
import User, {UserJSON} from "./User";
import Server from "../../common/services/Server";
import {PrimaryKey, Property, ManyToOne, Index, Unique} from "@mikro-orm/core";
import {Entity as DBEntity} from "@mikro-orm/core/decorators/Entity";

@DBEntity()
@Unique({name: "token", properties: ["token"] as (keyof APIKey)[]})
@Index({name: "time_created", properties: ["time_created"] as (keyof APIKey)[]})
@Index({name: "time_updated", properties: ["time_updated"] as (keyof APIKey)[]})
export default class APIKey extends Entity<APIKey>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string = v4();

  @Property({length: 230, lazy: true})
  public token: string = APIKey.generateToken(this.id);

  // @Property({type: "json",  transformer: {to: (value: Permission) => value.toJSON(), from: (init: PermissionLevel[]) => new Permission(init)}})
  @Property({type: "json"})
  public permission: Permission = new Permission();

  @Property()
  public limit_per_decasecond: number;

  @Property()
  public limit_per_minute: number;

  @ManyToOne(() => User, {length: 36})
  public user?: User;

  @Property()
  public time_created: Date = new Date();

  @Property({onUpdate: () => new Date()})
  public time_updated: Date = new Date();

  //endregion ----- Properties -----

  //region    ----- Utility methods -----

  public static generateToken(id: string = v4()) {
    return JWT.sign({id}, process.env.JWT_SECRET!, {algorithm: "HS512", expiresIn: "7d"});
  }

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "user");
    return query;
  }

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @APIKey.get("/count", {permission: PermissionLevel.API_KEY_VIEW})
  @APIKey.bindParameter("name", ValidatorType.STRING, {max_length: 64})
  private static async getCount({locals: {respond, user}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    return respond(await this.count({user: user?.id}));
  }

  @APIKey.get("/", {permission: PermissionLevel.API_KEY_VIEW})
  @APIKey.bindPagination(100, ["id", "time_created"])
  public static async getMany({locals: {respond, user, api_key, params: pagination}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    return respond(await this.find({user: user?.id}, {...pagination, populate: api_key?.user?.id === user?.id ? ["token"] : []}));
  }


  @APIKey.get("/:id", {permission: PermissionLevel.API_KEY_VIEW})
  public static async getOne({params: {id}, locals: {respond, user, api_key}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    return respond(await this.findOne({id, user: user?.id}, {populate: api_key?.user?.id === user?.id ? ["token"] : []}));
  }

  @APIKey.post("/", {permission: [PermissionLevel.USER_ELEVATED, PermissionLevel.API_KEY_CREATE]})
  @APIKey.bindParameter<Request.postOne>("user", ValidatorType.UUID)
  @APIKey.bindParameter<Request.postOne>("permission", ValidatorType.STRING)
  @APIKey.bindParameter<Request.postOne>("limit_per_decasecond", ValidatorType.INTEGER, {min: 0})
  @APIKey.bindParameter<Request.postOne>("limit_per_minute", ValidatorType.INTEGER, {min: 0})
  private static async postOne({locals: {respond, user, api_key, params}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    // const {user: user_id, permission: permission_json, limit_per_decasecond, limit_per_minute} = params!;
    // const permission = new Permission(JSON.parse(permission_json));
    // const entity = this.manager.getRepository(APIKey).create({permission, limit_per_decasecond, limit_per_minute});
    //
    // try {
    //   entity.user = await User.performSelect(user_id);
    // }
    // catch (error) {
    //   respond?.(error);
    // }
    //
    // try {
    //   const inserted = await this.performInsert(entity);
    //   if (api_key?.user !== user) _.unset(inserted, "token" as keyof APIKey);
    //   respond?.(inserted);
    // }
    // catch (error) {
    //   respond?.(error);
    // }
  }

  @APIKey.put("/:id", {permission: PermissionLevel.API_KEY_UPDATE})
  @APIKey.bindParameter<Request.putOne>("permission", ValidatorType.STRING)
  @APIKey.bindParameter<Request.putOne>("limit_per_decasecond", ValidatorType.INTEGER, {min: 0})
  @APIKey.bindParameter<Request.putOne>("limit_per_minute", ValidatorType.INTEGER, {min: 0})
  private static async putOne({params: {id}, locals: {respond, user, api_key, params}}: Server.Request<{id: string}, Response.putOne, Request.putOne>) {
    // const {permission: permission_json, limit_per_decasecond, limit_per_minute} = params!;
    //
    // try {
    //   const permission = new Permission(JSON.parse(permission_json));
    //   const updated = await this.performUpdate(id, {permission, limit_per_decasecond, limit_per_minute});
    //   if (api_key?.user !== user) _.unset(updated, "token" as keyof APIKey);
    //   respond?.(updated);
    // }
    // catch (error) {
    //   respond?.(error);
    // }
  }

  @APIKey.delete("/:id", {permission: PermissionLevel.API_KEY_DELETE})
  private static async deleteOne({params: {id}, locals: {respond, api_key, user}}: Server.Request<{id: string}, Response.deleteOne, Request.deleteOne>) {
    // const entity = await this.performSelect(id);
    // if (entity.user?.id !== user?.id) {
    //   return respond?.(new ServerException(403, {}, "Forbidden from deleting an API Key with the same or higher access level as your own."));
    // }
    //
    // const count = await this.addValueClause(this.createSelect(), "user", entity.user?.id).getCount();
    // if (count <= 1) {
    //   return respond?.(new ServerException(400, {}, "A user must always have at least one API Key, please create a new one before deleting this."));
    // }
    //
    // try {
    //   respond?.(await this.performDelete(id));
    // }
    // catch (error) {
    //   respond?.(error);
    // }
  }

  //endregion ----- Endpoint methods -----

}

export type APIKeyJSON = {
  id: string
  token: string
  permission: PermissionLevel[]
  limit_per_decasecond: number
  limit_per_minute: number
  user?: UserJSON
  time_created: Date
  time_updated: Date
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

