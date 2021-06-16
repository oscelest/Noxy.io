import JWT from "jsonwebtoken";
import {v4} from "uuid";
import Permission from "../../common/classes/Permission";
import ValidatorType from "../../common/enums/ValidatorType";
import PermissionLevel from "../../common/enums/PermissionLevel";
import Entity, {Pagination} from "../../common/classes/Entity";
import ServerException from "../../common/exceptions/ServerException";
import User from "./User";
import Server from "../../common/services/Server";
import {PrimaryKey, Property, ManyToOne, Index, Unique} from "@mikro-orm/core";
import {Entity as DBEntity} from "@mikro-orm/core/decorators/Entity";
import PermissionType from "../../common/type/PermissionType";
import _ from "lodash";

@DBEntity()
@Unique({name: "token", properties: ["token"] as (keyof APIKey)[]})
@Index({name: "time_created", properties: ["time_created"] as (keyof APIKey)[]})
@Index({name: "time_updated", properties: ["time_updated"] as (keyof APIKey)[]})
export default class APIKey extends Entity<APIKey>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string = v4();

  @Property({length: 230})
  public token: string = APIKey.generateToken(this.id);

  @Property({type: PermissionType})
  public permission: Permission = new Permission();

  @Property()
  public limit_per_decasecond: number;

  @Property()
  public limit_per_minute: number;

  @ManyToOne(() => User, {length: 36, onDelete: "cascade"})
  public user: User;

  @Property()
  public time_created: Date = new Date();

  @Property({onUpdate: () => new Date()})
  public time_updated: Date = new Date();

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  public secure(current_user?: boolean) {
    if (current_user) return this;
    return Object.assign(new APIKey(), this, {token: undefined} as Initializer<User>);
  }

  // public toJSON(parent: string = "content", strip: (keyof Initializer<APIKey>)[] = []) {
  //   return {
  //     id:                   this.id,
  //     token:                this.token,
  //     permission:           this.permission.toJSON(),
  //     limit_per_decasecond: this.limit_per_decasecond,
  //     limit_per_minute:     this.limit_per_minute,
  //     user:                 !strip.includes("user") ? this.user.toJSON(APIKey.name, ["api_key_list"]) : this.user.id,
  //     time_updated:         this.time_updated,
  //     time_created:         this.time_created,
  //   };
  // }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  public static generateToken(id: string = v4()) {
    return JWT.sign({id}, process.env.JWT_SECRET!, {algorithm: "HS512", expiresIn: "7d"});
  }

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @APIKey.get("/count", {permission: PermissionLevel.API_KEY_VIEW})
  @APIKey.bindParameter("name", ValidatorType.STRING, {max_length: 64})
  private static async getCount({locals: {respond, user}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    return respond(await this.count({user}));
  }

  @APIKey.get("/", {permission: PermissionLevel.API_KEY_VIEW})
  @APIKey.bindPagination(100, ["id", "time_created"])
  public static async getMany({locals: {respond, user, api_key, params: pagination}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const entity = await this.find({user}, {...pagination});
    return respond(_.map(entity, entity => entity.secure(entity.user?.id === api_key?.user?.id)));
  }

  @APIKey.get("/:id", {permission: PermissionLevel.API_KEY_VIEW})
  public static async getOne({params: {id}, locals: {respond, user, api_key}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    const entity = await this.findOne({id, user});
    return respond(entity.secure(entity.user?.id === api_key?.user?.id));
  }

  @APIKey.post("/", {permission: [PermissionLevel.API_KEY_CREATE]})
  @APIKey.bindParameter<Request.postOne>("permission", ValidatorType.STRING)
  @APIKey.bindParameter<Request.postOne>("limit_per_decasecond", ValidatorType.INTEGER, {min: 0})
  @APIKey.bindParameter<Request.postOne>("limit_per_minute", ValidatorType.INTEGER, {min: 0})
  private static async postOne({locals: {respond, user, api_key, params: {permission, limit_per_decasecond, limit_per_minute}}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    const entity = await this.persist({user, limit_per_decasecond, limit_per_minute, permission: new Permission(JSON.parse(permission))});
    return respond(entity.secure(entity.user?.id === api_key?.user?.id));
  }

  @APIKey.put("/:id", {permission: PermissionLevel.API_KEY_UPDATE})
  @APIKey.bindParameter<Request.putOne>("permission", ValidatorType.STRING)
  @APIKey.bindParameter<Request.putOne>("limit_per_decasecond", ValidatorType.INTEGER, {min: 0})
  @APIKey.bindParameter<Request.putOne>("limit_per_minute", ValidatorType.INTEGER, {min: 0})
  private static async putOne({params: {id}, locals: {respond, user, api_key, params}}: Server.Request<{id: string}, Response.putOne, Request.putOne>) {
    const {permission, limit_per_decasecond, limit_per_minute} = params;
    const entity = await this.persist(await this.findOne({id, user}), {user, limit_per_decasecond, limit_per_minute, permission: new Permission(JSON.parse(permission))});
    return respond(entity.secure(entity.user?.id === api_key?.user?.id));
  }

  @APIKey.delete("/:id", {permission: PermissionLevel.API_KEY_DELETE})
  private static async deleteOne({params: {id}, locals: {respond, user, api_key}}: Server.Request<{id: string}, Response.deleteOne, Request.deleteOne>) {
    if (await this.count({user}) === 1) return respond(new ServerException(400, {}, "A user must always have at least one API Key, please create a new one before deleting this."));

    const entity = await this.remove({id, user});
    return respond(entity.secure(entity.user?.id === api_key?.user?.id));
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

