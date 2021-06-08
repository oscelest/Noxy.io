import crypto from "crypto";
import JSONWebToken from "jsonwebtoken";
import JWT from "jsonwebtoken";
import * as TypeORM from "typeorm";
import Entity, {Pagination} from "../../common/classes/Entity";
import ValidatorType from "../../common/enums/ValidatorType";
import ServerException from "../../common/exceptions/ServerException";
import Email from "../../common/services/Email";
import Server from "../../common/services/Server";
import APIKey, {APIKeyJSON} from "./APIKey";
import PermissionLevel from "../../common/enums/PermissionLevel";
import {Entity as DBEntity} from "@mikro-orm/core/decorators/Entity";
import {Unique, Index, PrimaryKey, Property, OneToMany, Collection} from "@mikro-orm/core";
import {v4} from "uuid";

@DBEntity()
@Unique({name: "email", properties: ["email"] as (keyof User)[]})
@Index({name: "time_created", properties: ["time_created"] as (keyof User)[]})
@Index({name: "time_updated", properties: ["time_updated"] as (keyof User)[]})
export default class User extends Entity<User>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string = v4();

  @Property({length: 512})
  public email: string;

  @Property({length: 64})
  public username: string;

  @Property({hidden: true})
  public salt: Buffer;

  @Property({hidden: true})
  public hash: Buffer;

  @OneToMany(() => APIKey, entity => entity.user)
  public api_key_list: Collection<APIKey> = new Collection<APIKey>(this);

  @Property()
  public time_login: Date = new Date();

  @Property()
  public time_created: Date = new Date();

  @Property({onUpdate: () => new Date()})
  public time_updated: Date = new Date();

  //endregion ----- Properties -----

  //region    ----- Utility methods -----

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @User.get("/", {permission: [PermissionLevel.USER_MASQUERADE]})
  @User.bindParameter<Request.getMany>("email", ValidatorType.STRING, {min_length: 1})
  @User.bindPagination(100, ["id", "email", "time_created"])
  public static async getMany({locals: {respond, params: {email, ...pagination}}}: Server.Request<{}, Response.getMany, Request.getMany>) {
    return respond(await this.find({email: {$like: email}}, {...pagination, populate: "api_key_list"}));
  }

  @User.get("/count", {permission: [PermissionLevel.USER_MASQUERADE]})
  @User.bindParameter<Request.getMany>("email", ValidatorType.STRING, {min_length: 1})
  @User.bindPagination(100, ["id", "email", "time_created"])
  public static async getCount({locals: {respond, params: {email}}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    return respond(await this.count({email}));
  }

  @User.get("/:id", {permission: [PermissionLevel.USER_MASQUERADE]})
  public static async getOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    return respond(await this.findOne({id}, {populate: id === user?.id ? {api_key_list: "token"} : "api_key_list"}));
  }


  @User.post("/", {user: false})
  @User.bindParameter<Request.postOne>("email", ValidatorType.EMAIL)
  @User.bindParameter<Request.postOne>("username", ValidatorType.STRING, {min_length: 3, max_length: 64})
  @User.bindParameter<Request.postOne>("password", ValidatorType.PASSWORD)
  public static async postOne({locals: {respond, params: {email, username, password: {salt, hash}}}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    const user = this.create({email, username, salt, hash});
    const api_key = APIKey.create({user, limit_per_decasecond: 10, limit_per_minute: 30});
    user.api_key_list = new Collection<APIKey>(user, [api_key]);
    await this.persist(user);

    return respond(user);
  }


  @User.post("/login", {user: false})
  @User.bindParameter<Request.postLogin>("email", ValidatorType.EMAIL, {flag_optional: true})
  @User.bindParameter<Request.postLogin>("password", ValidatorType.STRING, {min_length: 12}, {flag_optional: true})
  public static async postLogin({locals: {respond, user, api_key, params: {email, password}}}: Server.Request<{}, Response.postLogin, Request.postLogin>) {
    if (email && password) {
      user = await this.findOne({email});

      if (!crypto.pbkdf2Sync(password, user.salt, 10000, 255, "sha512").equals(user.hash)) {
        return respond(new ServerException(400));
      }
    }
    else {
      user = api_key?.user;
    }

    if (user) {
      await user.api_key_list.init();
      for (let api_key of user.api_key_list.getItems()) {
        api_key.token = APIKey.generateToken(api_key.id);
      }
      return respond(await this.persist({...user, time_login: new Date()}));
    }

    return respond(new ServerException(400));
  }


  @User.post("/request-reset", {user: false})
  @User.bindParameter<Request.postRequestReset>("email", ValidatorType.EMAIL)
  public static async postResetRequest({locals: {respond, params: {email}}}: Server.Request<{}, Response.postRequestReset, Request.postRequestReset>) {
    const user = await this.findOne({email});
    const token = JWT.sign({id: user.id}, user.salt.toString(), {algorithm: "HS512", expiresIn: "15m"});
    await Email.send({
      Source:      "support@noxy.io",
      Destination: {
        ToAddresses: [user.email],
      },
      Message:     {
        Subject: {
          Data: "Password reset",
        },
        Body:    {
          Html: {
            Data:
              `<p>Hi ${user.username},` +
              "<p>A request to reset the password for this account has been received. If you have not requested a password reset, you can safely ignore this email.</p>" +
              "<p>However, if you did request a password reset, please use the following link within the next 15 minutes:</p>" +
              `<p><a href="${process.env.MAIN_DOMAIN}/reset?token=${token}">Reset password here!</a></p>` +
              "<p>" +
              "<span>Best regards,</span>" +
              "<br>" +
              "<span>Noxy.io</span>" +
              "</p>",
          },
        },
      },
    });
    return respond({});
  }

  @User.post("/confirm-reset", {user: false})
  @User.bindParameter<Request.postConfirmReset>("password", ValidatorType.PASSWORD)
  @User.bindParameter<Request.postConfirmReset>("token", ValidatorType.STRING)
  public static async postResetConfirm({locals: {respond, params: {password: {salt, hash}, token}}}: Server.Request<{}, Response.postConfirmReset, Request.postConfirmReset>) {
    const {id} = JWT.decode(token) as {id: string} ?? {};
    const user = await this.findOne({id});

    try {
      JWT.verify(token, user.salt.toString(), {algorithms: ["HS512"]});
    }
    catch (error) {
      if (error instanceof JSONWebToken.TokenExpiredError) return respond(new ServerException(410));
      if (error instanceof JSONWebToken.JsonWebTokenError) return respond(new ServerException(404));
      if (error instanceof TypeORM.EntityNotFoundError) return respond(new ServerException(404));
      return respond(error);
    }

    return respond(await this.persist({...user, salt, hash}));
  }

  @User.put("/:id")
  @User.bindParameter<Request.putOne>("email", ValidatorType.EMAIL, {flag_optional: true})
  @User.bindParameter<Request.putOne>("username", ValidatorType.STRING, {min_length: 3, max_length: 64}, {flag_optional: true})
  @User.bindParameter<Request.putOne>("password", ValidatorType.PASSWORD, {flag_optional: true})
  public static async putOne({params: {id}, locals: {respond, user, params}}: Server.Request<{id: string}, Response.putOne, Request.putOne>) {
    // const {email, username, password} = params!;
    //
    // const user_entity = await User.performSelect(id);
    // if (user?.id !== user_entity.id) {
    //   return respond(new ServerException(403));
    // }
    //
    // if (!_.some(params)) {
    //   return respond(new ServerException(400));
    // }
    //
    // return respond(await this.performUpdate(
    //   user_entity.id,
    //   {
    //     username: username ?? user_entity.username,
    //     email:    email ?? user_entity.email,
    //     salt:     password?.salt ?? user_entity.salt,
    //     hash:     password?.hash ?? user_entity.hash,
    //   },
    // ));
    return respond(new ServerException(501));
  }

  //endregion ----- Endpoint methods -----
}

export type UserJSON = {
  id: string
  email: string
  username: string
  api_key_list?: APIKeyJSON[]
  time_login: Date
  time_created: Date
}

namespace Request {
  export type getCount = {email?: string}
  export type getMany = {email?: string} & Pagination
  export type getOne = never;
  export type postLogin = {email: string, password: string}
  export type postRequestReset = {email: string}
  export type postConfirmReset = {token: string, password: {salt: Buffer, hash: Buffer}}
  export type postOne = {username: string, email: string, password: {salt: Buffer, hash: Buffer}}
  export type putOne = {username: string, email: string, password: {salt: Buffer, hash: Buffer}}
}

namespace Response {
  export type getCount = number | ServerException
  export type getMany = User[] | ServerException
  export type getOne = User | ServerException
  export type postLogin = User | ServerException
  export type postRequestReset = {}
  export type postConfirmReset = User | ServerException
  export type postOne = User | ServerException
  export type putOne = User | ServerException
}
