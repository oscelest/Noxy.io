import crypto from "crypto";
import JSONWebToken from "jsonwebtoken";
import JWT from "jsonwebtoken";
import _ from "lodash";
import * as TypeORM from "typeorm";
import Entity, {Pagination} from "../../common/classes/Entity";
import Permission from "../../common/classes/Permission";
import ValidatorType from "../../common/enums/ValidatorType";
import ServerException from "../../common/exceptions/ServerException";
import Email from "../../common/services/Email";
import Server from "../../common/services/Server";
import APIKey, {APIKeyJSON} from "./APIKey";
import File from "./File";
import FileTag from "./FileTag";

@TypeORM.Entity()
@TypeORM.Unique("email", ["email"])
export default class User extends Entity<User>(TypeORM) {

  //region    Properties

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 128})
  public email: string;

  @TypeORM.Column({type: "varchar", length: 64})
  public username: string;

  @TypeORM.Column({type: "binary", length: 64})
  public salt: Buffer;

  @TypeORM.Column({type: "binary", length: 255})
  public hash: Buffer;

  @TypeORM.OneToMany(() => APIKey, api_key => api_key.user)
  public api_key_list?: APIKey[];

  @TypeORM.Column({type: "datetime", nullable: true, default: null})
  public time_login: Date;

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, select: false, default: null})
  public time_updated: Date;

  //endregion Properties

  //region    Relations


  @TypeORM.OneToMany(() => File, file => file.user_created)
  public file_created_list?: File[];

  @TypeORM.OneToMany(() => FileTag, file_tag => file_tag.user_created)
  public file_tag_created_list?: FileTag[];

  //endregion Relations

  //region    Instance methods

  public toJSON(): UserJSON {
    return {
      id:           this.id,
      email:        this.email,
      username:     this.username,
      api_key_list: _.map(this.api_key_list ?? [], entity => entity.toJSON()),
      time_login:   this.time_login,
      time_created: this.time_created,
    };
  }

  //endregion Instance methods

  //region    Utility methods

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "api_key_list");
    return query;
  }

  //endregion Utility methods

  //region    Endpoint methods

  @User.get("/")
  @User.bindParameter<Request.getFindMany>("email", ValidatorType.STRING, {min_length: 1})
  @User.bindPagination(100, ["id", "email", "time_created"])
  public static async findMany({locals: {respond, api_key, parameters}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const {skip, limit, order, email} = parameters!;
    const query = this.createPaginated({skip, limit, order});
    this.addWildcardClause(query, "email", email);

    try {
      const retrieved = await query.getMany();
      _.each(retrieved, user => api_key?.user !== user && _.each(user.api_key_list, api_key => _.unset(api_key, "token" as keyof APIKey)));
      return respond?.(retrieved);
    }
    catch (error) {
      return respond?.(error);
    }
  }


  @User.post("/", {user: false})
  @User.bindParameter<Request.postCreateOne>("email", ValidatorType.EMAIL)
  @User.bindParameter<Request.postCreateOne>("username", ValidatorType.STRING, {min_length: 3, max_length: 64})
  @User.bindParameter<Request.postCreateOne>("password", ValidatorType.PASSWORD)
  public static async createOne({locals: {respond, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {username, email, password} = parameters!;
    const {salt, hash} = password ?? {};

    try {
      const user = await this.performInsert({username, email, salt, hash});
      const api_key = TypeORM.getRepository(APIKey).create({user, limit_per_decasecond: 10, limit_per_minute: 30, permission: new Permission()}).generateToken();
      user.api_key_list = [await APIKey.performInsert(api_key)];

      return respond?.(user);
    }
    catch (error) {
      if (error.errno === 1062) return respond?.(new ServerException(409));
      return respond?.(error);
    }
  }


  @User.post("/login", {user: false})
  @User.bindParameter<Request.postLogin>("email", ValidatorType.EMAIL, {flag_optional: true})
  @User.bindParameter<Request.postLogin>("password", ValidatorType.STRING, {min_length: 12}, {flag_optional: true})
  public static async login({locals: {respond, user, parameters}}: Server.Request<{}, Response.postLogin, Request.postLogin>) {

    const {email, password} = parameters!;

    try {
      if (email && password) {
        user = await this.createSelect().where({email}).getOneOrFail();

        if (!crypto.pbkdf2Sync(password, user.salt, 10000, 255, "sha512").equals(user.hash)) {
          return respond?.(new ServerException(400));
        }
      }

      if (user) {
        await Promise.all(_.map(user.api_key_list, async ({id}) => await APIKey.performUpdate(id, {token: JWT.sign({id}, process.env.JWT_SECRET!, {algorithm: "HS512", expiresIn: "7d"})})));
        return respond?.(await this.performUpdate(user.id, {time_login: new Date()}));
      }

      return respond?.(new ServerException(400));
    }
    catch (error) {
      if (error instanceof TypeORM.EntityNotFoundError) return respond?.(new ServerException(400, parameters));
      console.log(error);
      return respond?.(error);
    }
  }


  @User.post("/request-reset", {user: false})
  @User.bindParameter<Request.postRequestReset>("email", ValidatorType.EMAIL)
  public static async requestReset({locals: {respond, parameters}}: Server.Request<{}, Response.postRequestReset, Request.postRequestReset>) {
    const {email} = parameters!;

    try {
      const user = await this.createSelect().where({email}).getOneOrFail();
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
      return respond?.({});
    }
    catch (error) {
      if (error instanceof TypeORM.EntityNotFoundError) return respond?.(new ServerException(404));
      return respond?.(error);
    }
  }

  @User.post("/confirm-reset", {user: false})
  @User.bindParameter<Request.postConfirmReset>("password", ValidatorType.PASSWORD)
  @User.bindParameter<Request.postConfirmReset>("token", ValidatorType.STRING)
  public static async confirmReset({locals: {respond, parameters}}: Server.Request<{}, Response.postConfirmReset, Request.postConfirmReset>) {
    const {password: {salt, hash}, token} = parameters!;

    try {
      const {id} = JWT.decode(token) as {id: string} ?? {};
      const user = await this.performSelect(id);
      JWT.verify(token, user.salt.toString(), {algorithms: ["HS512"]});

      return respond?.(await this.performUpdate(user.id, {salt, hash}));
    }
    catch (error) {
      if (error instanceof JSONWebToken.TokenExpiredError) return respond?.(new ServerException(410));
      if (error instanceof JSONWebToken.JsonWebTokenError) return respond?.(new ServerException(404));
      if (error instanceof TypeORM.EntityNotFoundError) return respond?.(new ServerException(404));
      return respond?.(error);
    }
  }

  @User.put("/:id")
  @User.bindParameter<Request.putUpdateOne>("email", ValidatorType.EMAIL, {flag_optional: true})
  @User.bindParameter<Request.putUpdateOne>("username", ValidatorType.STRING, {min_length: 3, max_length: 64}, {flag_optional: true})
  @User.bindParameter<Request.putUpdateOne>("password", ValidatorType.PASSWORD, {flag_optional: true})
  public static async updateOne({params: {id}, locals: {respond, user, parameters}}: Server.Request<{id: string}, Response.putUpdateOne, Request.putUpdateOne>) {
    const {email, username, password} = parameters!;

    const user_entity = await User.performSelect(id);
    if (user?.id !== user_entity.id) {
      return respond?.(new ServerException(403));
    }

    if (!_.some(parameters)) {
      return respond?.(new ServerException(400));
    }

    return respond?.(await this.performUpdate(
      user_entity.id,
      {
        username: username ?? user_entity.username,
        email:    email ?? user_entity.email,
        salt:     password?.salt ?? user_entity.salt,
        hash:     password?.hash ?? user_entity.hash,
      },
    ));
  }

  //endregion Endpoint methods
}

export type UserJSON = {
  id: string
  email: string
  username: string
  api_key_list: APIKeyJSON[]
  time_login: Date
  time_created: Date
}

namespace Request {
  export type getFindMany = getCount & Pagination
  export type getCount = {email?: string}
  export type postLogin = {email: string, password: string}
  export type postRequestReset = {email: string}
  export type postConfirmReset = {token: string, password: {salt: Buffer, hash: Buffer}}
  export type postCreateOne = {username: string, email: string, password: {salt: Buffer, hash: Buffer}}
  export type putUpdateOne = {username: string, email: string, password: {salt: Buffer, hash: Buffer}}
}

namespace Response {
  export type getFindMany = User[] | ServerException
  export type postLogin = User | ServerException
  export type postRequestReset = {}
  export type postConfirmReset = User | ServerException
  export type postCreateOne = User | ServerException
  export type putUpdateOne = User | ServerException
}
