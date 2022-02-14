import {Cascade, Collection, Entity, FilterQuery, Index, OneToMany, PrimaryKey, Property, Unique} from "@mikro-orm/core";
import Permission from "../../common/classes/Permission";
import crypto from "crypto";
import JWT from "jsonwebtoken";
import {v4} from "uuid";
import DatabaseEntity, {Pagination} from "../../common/classes/Entity/DatabaseEntity";
import PermissionLevel from "../../common/enums/PermissionLevel";
import ValidatorType from "../../common/enums/ValidatorType";
import ServerException from "../../common/exceptions/ServerException";
import Email from "../../common/services/Email";
import Server from "../../common/services/Server";
import APIKey from "./APIKey";

@Entity()
@Unique({name: "email", properties: ["email"] as (keyof User)[]})
@Index({name: "time_created", properties: ["time_created"] as (keyof User)[]})
@Index({name: "time_updated", properties: ["time_updated"] as (keyof User)[]})
export default class User extends DatabaseEntity<User>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string;

  @Property({length: 512})
  public email: string;

  @Property({length: 64})
  public username: string;

  @Property({hidden: true})
  public salt: Buffer;

  @Property({hidden: true})
  public hash: Buffer;

  @OneToMany(() => APIKey, entity => entity.user, {cascade: [Cascade.ALL], name: "api_key_list"})
  public api_key_list: Collection<APIKey>;

  @Property({nullable: true})
  public time_login: Date;

  @Property()
  public time_created: Date;

  @Property({onUpdate: () => new Date(), nullable: true})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  public secure(current_user?: boolean) {
    return current_user ? this : new User({...this, api_key_list: this.api_key_list.getItems().map(entity => entity.secure(current_user))});
  }

  //endregion ----- Instance methods -----

  //region    ----- Static properties -----

  //endregion ----- Static properties -----

  //region    ----- Endpoint methods -----

  @User.get("/count", {permission: [PermissionLevel.USER_MASQUERADE]})
  @User.bindParameter<Request.getMany>("email", ValidatorType.STRING, {min_length: 1})
  @User.bindPagination(100, ["id", "email", "time_created"])
  public static async getCount({locals: {respond, params: {email}}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    const where: FilterQuery<User> = {};
    if (email) where.email = {$like: `%${email}%`};

    return respond(await this.getRepository().count(where));
  }

  @User.get("/", {permission: [PermissionLevel.USER_MASQUERADE]})
  @User.bindParameter<Request.getMany>("email", ValidatorType.STRING, {min_length: 1})
  @User.bindPagination(100, ["id", "email", "time_created"])
  public static async getMany({locals: {respond, api_key, params: {email, limit, skip: offset, order: orderBy}}}: Server.Request<{}, Response.getMany, Request.getMany>) {
    const where: FilterQuery<User> = {};
    if (email) where.email = {$like: `%${email}%`};

    const entity_list = await this.getRepository().find(where, {limit, offset, orderBy, populate: ["api_key_list"]});
    return respond(entity_list.map(entity => entity.secure(entity.id === api_key.user.id)));
  }

  @User.get("/:id", {permission: [PermissionLevel.USER_MASQUERADE]})
  public static async getOne({params: {id}, locals: {respond, api_key}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    const entity = await this.getRepository().findOneOrFail({id}, {populate: ["api_key_list"]});
    return respond(entity.secure(entity.id === api_key.user.id));
  }

  @User.post("/", {user: false})
  @User.bindParameter<Request.postOne>("email", ValidatorType.EMAIL)
  @User.bindParameter<Request.postOne>("username", ValidatorType.STRING, {min_length: 3, max_length: 64})
  @User.bindParameter<Request.postOne>("password", ValidatorType.PASSWORD)
  public static async postOne({locals: {respond, params}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    const user_entity = User.getRepository().create({
      id:           v4(),
      email:        params.email,
      username:     params.username,
      salt:         params.password.salt,
      hash:         params.password.hash,
      api_key_list: [],
      time_login:   null,
      time_updated: null,
      time_created: new Date(),
    });
    User.getRepository().persist(user_entity);

    const api_key_id = v4();
    const api_key_entity = APIKey.getRepository().create({
      id:                   api_key_id,
      user:                 user_entity,
      limit_per_decasecond: 10,
      limit_per_minute:     30,
      token:                APIKey.generateToken(api_key_id),
      permission:           new Permission(),
      time_created:         new Date(),
      time_updated:         null,
    });
    APIKey.getRepository().persistAndFlush(api_key_entity);

    user_entity.api_key_list.add(api_key_entity);

    return respond(user_entity);
  }

  @User.post("/login", {user: false})
  @User.bindParameter<Request.postLogin>("email", ValidatorType.EMAIL, {optional: true})
  @User.bindParameter<Request.postLogin>("password", ValidatorType.STRING, {min_length: 12}, {optional: true})
  public static async postLogin({locals: {respond, user, api_key, params: {email, password}}}: Server.Request<{}, Response.postLogin, Request.postLogin>) {
    if (email && password) {
      user = await this.getRepository().findOneOrFail({email}, {populate: ["api_key_list"]});

      if (!crypto.pbkdf2Sync(password, user.salt, 10000, 255, "sha512").equals(user.hash)) {
        return respond(new ServerException(400));
      }
    }
    else if (api_key) {
      user = api_key.user;
    }

    if (user) {
      user.time_login = new Date();
      await this.getRepository().persist(user);

      return respond(user);
    }

    return respond(new ServerException(400));
  }

  @User.post("/request-reset", {user: false})
  @User.bindParameter<Request.postRequestReset>("email", ValidatorType.EMAIL)
  public static async postResetRequest({locals: {respond, params: {email}}}: Server.Request<{}, Response.postRequestReset, Request.postRequestReset>) {
    const user = await this.getRepository().findOneOrFail({email}, {populate: ["api_key_list"]});
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
    try {
      const {id} = JWT.decode(token) as {id: string} ?? {};
      const user = await this.getRepository().findOneOrFail({id}, {populate: ["api_key_list"]});

      await JWT.verify(token, user.salt.toString(), {algorithms: ["HS512"]});

      user.salt = salt;
      user.hash = hash;
      await this.getRepository().persist(user);

      return respond(user);
    }
    catch (error) {
      if (error instanceof JWT.JsonWebTokenError) return respond(new ServerException(404));
      if (error instanceof JWT.TokenExpiredError) return respond(new ServerException(410));
      if (!(error instanceof ServerException)) return respond(new ServerException(500, error));
      return respond(error);
    }
  }

  @User.put("/:id")
  @User.bindParameter<Request.putOne>("email", ValidatorType.EMAIL, {optional: true})
  @User.bindParameter<Request.putOne>("username", ValidatorType.STRING, {min_length: 3, max_length: 64}, {optional: true})
  @User.bindParameter<Request.putOne>("password", ValidatorType.PASSWORD, {optional: true})
  public static async putOne({params: {id}, locals: {respond, user, api_key, params: {email, username, password: {salt, hash}}}}: Server.Request<{id: string}, Response.putOne, Request.putOne>) {
    if (user?.id !== id) return respond(new ServerException(403));

    const entity = await this.getRepository().findOneOrFail({id});
    entity.email = email;
    entity.username = username;
    entity.salt = salt;
    entity.hash = hash;
    await this.getRepository().persist(entity);

    return respond(entity.secure(entity.id === api_key?.user?.id));
  }

  //endregion ----- Endpoint methods -----
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
