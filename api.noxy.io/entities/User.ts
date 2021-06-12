import {Entity as DBEntity, Unique, Index, PrimaryKey, Property, OneToMany, Collection} from "@mikro-orm/core";
import crypto from "crypto";
import JWT from "jsonwebtoken";
import _ from "lodash";
import {v4} from "uuid";
import APIKey, {APIKeyJSON} from "./APIKey";
import Entity, {Pagination} from "../../common/classes/Entity";
import ValidatorType from "../../common/enums/ValidatorType";
import PermissionLevel from "../../common/enums/PermissionLevel";
import ServerException from "../../common/exceptions/ServerException";
import Email from "../../common/services/Email";
import Server from "../../common/services/Server";
import WhereCondition from "../../common/classes/WhereCondition";

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

  //region    ----- Instance methods -----

  public secure(current_user?: boolean) {
    if (current_user) return this;
    return Object.assign(new User(), this, {api_key_list: new Collection<APIKey>({}, _.map(this.api_key_list.getItems(), entity => entity.secure(current_user)))} as Initializer<User>);
  }

  public toJSON(strict: boolean = true, strip: (keyof User)[] = []): UserJSON {
    return {
      id:           this.id,
      email:        this.email,
      username:     this.username,
      api_key_list: !strip.includes("api_key_list")
                      ? _.map(this.api_key_list.getItems(), entity => entity.toJSON(true, ["user"]))
                      : _.map(this.api_key_list.getItems(), entity => entity.id),
      time_created: this.time_created,
      time_login:   this.time_login,
    };
  }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @User.get("/count", {permission: [PermissionLevel.USER_MASQUERADE]})
  @User.bindParameter<Request.getMany>("email", ValidatorType.STRING, {min_length: 1})
  @User.bindPagination(100, ["id", "email", "time_created"])
  public static async getCount({locals: {respond, params: {email}}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    return respond(await this.count(this.where().andWildcard({email})));
  }

  @User.get("/", {permission: [PermissionLevel.USER_MASQUERADE]})
  @User.bindParameter<Request.getMany>("email", ValidatorType.STRING, {min_length: 1})
  @User.bindPagination(100, ["id", "email", "time_created"])
  public static async getMany({locals: {respond, api_key, params: {email, ...pagination}}}: Server.Request<{}, Response.getMany, Request.getMany>) {
    const entity_list = await this.find(this.where().andWildcard({email}), {...pagination, populate: "api_key_list"});
    return respond(_.map(entity_list, entity => entity.secure(entity.id === api_key?.user?.id)));
  }

  @User.get("/:id", {permission: [PermissionLevel.USER_MASQUERADE]})
  public static async getOne({params: {id}, locals: {respond, api_key}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    const entity = await this.findOne({id}, {populate: "api_key_list"});
    return respond(entity.secure(entity.id === api_key?.user?.id));
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
  @User.bindParameter<Request.postLogin>("email", ValidatorType.EMAIL, {optional: true})
  @User.bindParameter<Request.postLogin>("password", ValidatorType.STRING, {min_length: 12}, {optional: true})
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

      return respond(await this.persist(user, {time_login: new Date()}));
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
      if (error instanceof JWT.TokenExpiredError) return respond(new ServerException(410));
      if (error instanceof JWT.JsonWebTokenError) return respond(new ServerException(404));
      return respond(error);
    }

    return respond(await this.persist({...user, salt, hash}));
  }

  @User.put("/:id")
  @User.bindParameter<Request.putOne>("email", ValidatorType.EMAIL, {optional: true})
  @User.bindParameter<Request.putOne>("username", ValidatorType.STRING, {min_length: 3, max_length: 64}, {optional: true})
  @User.bindParameter<Request.putOne>("password", ValidatorType.PASSWORD, {optional: true})
  public static async putOne({params: {id}, locals: {respond, api_key, user, params: {email, username, password: {salt, hash}}}}: Server.Request<{id: string}, Response.putOne, Request.putOne>) {
    if (user?.id !== id) return respond(new ServerException(403));

    const entity = await this.persist({...await this.findOne({id}), email, username, salt, hash});
    return respond(entity.secure(entity.id === api_key?.user?.id));
  }

  //endregion ----- Endpoint methods -----
}

export type UserJSON = {
  id: string
  email: string
  username: string
  api_key_list?: string[] | APIKeyJSON[]
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
