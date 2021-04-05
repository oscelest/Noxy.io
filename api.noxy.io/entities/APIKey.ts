import Express from "express";
import JWT from "jsonwebtoken";
import _ from "lodash";
import * as TypeORM from "typeorm";
import {v4} from "uuid";
import Entity, {Pagination} from "../classes/Entity";
import Permission, {PermissionJSON} from "../classes/Permission";
import PermissionLevel from "../enums/PermissionLevel";
import EndpointParameterType from "../enums/server/EndpointParameterType";
import ServerException from "../exceptions/ServerException";
import User, {UserJSON} from "./User";

@TypeORM.Entity()
@TypeORM.Unique("token", ["token"])
export default class APIKey extends Entity<APIKey>() {

  /**
   * Properties
   */

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 190})
  public token: string;

  @TypeORM.Column({type: "json", transformer: {to: (value: Permission) => value.toJSON(), from: (init: PermissionJSON) => new Permission(init)}})
  public permission: Permission;

  @TypeORM.Column({type: "int", default: 100})
  public limit_per_decasecond: number;

  @TypeORM.Column({type: "int", default: 300})
  public limit_per_minute: number;

  @TypeORM.ManyToOne(() => User, user => user.api_key_list, {nullable: false})
  @TypeORM.JoinColumn({name: "user_id"})
  public user: User;
  public user_id: string;

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, select: false, default: null})
  public time_updated: Date;

  /**
   * Instance methods
   */

  public toJSON(): APIKeyJSON {
    return {
      id:                   this.id,
      token:                this.token,
      permission:           this.permission.toJSON(),
      limit_per_decasecond: this.limit_per_decasecond,
      limit_per_minute:     this.limit_per_minute,
      user:                 this.user?.toJSON(),
      time_created:         this.time_created,
      time_updated:         this.time_updated,
    };
  }

  public hasPermission(permission: PermissionLevel) {
    return this.permission.hasPermission(permission);
  }

  public generateToken() {
    this.token = JWT.sign(this.id = this.id || v4(), process.env.JWT_SECRET!, {algorithm: "HS512"});
    return this;
  }

  /**
   * Utility methods
   */

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "user");
    return query;
  }

  /**
   * Endpoint methods
   */

  @APIKey.get("/", {permission: PermissionLevel.API_KEY_VIEW})
  @APIKey.bindPagination(100, ["id", "time_created"])
  public static async findMany({locals: {respond, user, api_key, parameters}}: Express.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const {skip, limit, order} = parameters!;
    const query = this.createPaginated({skip, limit, order});

    this.addValueClause(query, "user", user?.id);

    try {
      const retrieved = await query.getMany();
      if (api_key?.user !== user) _.each(retrieved, entity => _.unset(entity, "token" as keyof APIKey));
      return respond?.(retrieved);
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @APIKey.get("/count", {permission: PermissionLevel.API_KEY_VIEW})
  @APIKey.bindParameter("name", EndpointParameterType.STRING, {max_length: 64})
  private static async count({locals: {respond, user}}: Express.Request<{}, Response.getCount, Request.getCount>) {
    const query = this.createSelect();

    this.addValueClause(query, "user", user?.id);

    try {
      return respond?.(await query.getCount());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @APIKey.get("/:id", {permission: PermissionLevel.API_KEY_VIEW})
  public static async findOneByID({params: {id}, locals: {respond, user, api_key}}: Express.Request<{id: string}, Response.getFindOne, Request.getFindOne>) {
    const query = this.createSelect();

    this.addValueClause(query, "id", id);
    this.addValueClause(query, "user", user?.id);

    try {
      const retrieved = await query.getOneOrFail();
      if (api_key?.user !== user) _.unset(retrieved, "token" as keyof APIKey);
      return respond?.(retrieved);
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @APIKey.post("/", {permission: [PermissionLevel.USER_ELEVATED, PermissionLevel.API_KEY_CREATE]})
  @APIKey.bindParameter<Request.postCreateOne>("user", EndpointParameterType.UUID)
  @APIKey.bindParameter<Request.postCreateOne>("permission", EndpointParameterType.STRING)
  @APIKey.bindParameter<Request.postCreateOne>("limit_per_decasecond", EndpointParameterType.INTEGER, {min: 0})
  @APIKey.bindParameter<Request.postCreateOne>("limit_per_minute", EndpointParameterType.INTEGER, {min: 0})
  private static async createOne({locals: {respond, user, api_key, parameters}}: Express.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {user: user_id, permission: permission_json, limit_per_decasecond, limit_per_minute} = parameters!;
    const permission = new Permission(JSON.parse(permission_json));
    const entity = TypeORM.getRepository(APIKey).create({permission, limit_per_decasecond, limit_per_minute}).generateToken();

    try {
      entity.user = await User.performSelect(user_id);
    }
    catch (error) {
      respond?.(error);
    }

    try {
      const inserted = await this.performInsert(entity);
      if (api_key?.user !== user) _.unset(inserted, "token" as keyof APIKey);
      respond?.(inserted);
    }
    catch (error) {
      respond?.(error);
    }
  }

  @APIKey.put("/:id", {permission: PermissionLevel.API_KEY_UPDATE})
  @APIKey.bindParameter<Request.putUpdateOne>("permission", EndpointParameterType.STRING)
  @APIKey.bindParameter<Request.putUpdateOne>("limit_per_decasecond", EndpointParameterType.INTEGER, {min: 0})
  @APIKey.bindParameter<Request.putUpdateOne>("limit_per_minute", EndpointParameterType.INTEGER, {min: 0})
  private static async updateOne({params: {id}, locals: {respond, user, api_key, parameters}}: Express.Request<{id: string}, Response.putUpdateOne, Request.putUpdateOne>) {
    const {permission: permission_json, limit_per_decasecond, limit_per_minute} = parameters!;

    try {
      const permission = new Permission(JSON.parse(permission_json));
      const updated = await this.performUpdate(id, {permission, limit_per_decasecond, limit_per_minute});
      if (api_key?.user !== user) _.unset(updated, "token" as keyof APIKey);
      respond?.(updated);
    }
    catch (error) {
      respond?.(error);
    }
  }

  @APIKey.delete("/:id", {permission: PermissionLevel.API_KEY_DELETE})
  private static async deleteOne({params: {id}, locals: {respond, api_key, user}}: Express.Request<{id: string}, Response.deleteDeleteOne, Request.deleteDeleteOne>) {
    const entity = await this.performSelect(id);
    if (!api_key?.permission.api_key.delete || (entity.user.id !== user?.id)) {
      return respond?.(new ServerException(403, {}, "Forbidden from deleting an API Key with the same or higher access level as your own."));
    }

    const count = await this.addValueClause(this.createSelect(), "user", entity.user.id).getCount();
    if (count <= 1) {
      return respond?.(new ServerException(400, {}, "A user must always have at least one API Key, please create a new one before deleting this."));
    }

    try {
      respond?.(await this.performDelete(id));
    }
    catch (error) {
      respond?.(error);
    }
  }
}

export type APIKeyJSON = {
  id: string
  token: string
  permission: boolean | PermissionJSON
  limit_per_decasecond: number
  limit_per_minute: number
  user?: UserJSON
  time_created: Date
  time_updated: Date
}

namespace Request {
  export type getFindMany = getCount & Pagination
  export type getCount = {user: string | string[]; search: string}
  export type getFindOne = never
  export type postCreateOne = {user: string; permission: string; limit_per_decasecond: number; limit_per_minute: number}
  export type putUpdateOne = {permission: string; limit_per_decasecond: number; limit_per_minute: number}
  export type deleteDeleteOne = {id: string}
}

namespace Response {
  export type getFindMany = APIKey[] | ServerException
  export type getCount = number
  export type getFindOne = APIKey | ServerException
  export type postCreateOne = APIKey | ServerException
  export type putUpdateOne = APIKey | ServerException
  export type deleteDeleteOne = APIKey | ServerException
}

