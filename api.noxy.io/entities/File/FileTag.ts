import {Entity, PrimaryKey, Property, Index, Unique, ManyToOne, FilterQuery} from "@mikro-orm/core";
import {v4} from "uuid";
import User from "../User";
import DatabaseEntity, {Pagination} from "../../../common/classes/Entity/DatabaseEntity";
import ValidatorType from "../../../common/enums/ValidatorType";
import ServerException from "../../../common/exceptions/ServerException";
import Server from "../../../common/services/Server";

@Entity()
@Unique({name: "file_tag", properties: ["name", "user"] as (keyof FileTag)[]})
@Index({name: "time_created", properties: ["time_created"] as (keyof FileTag)[]})
@Index({name: "time_updated", properties: ["time_updated"] as (keyof FileTag)[]})
export default class FileTag extends DatabaseEntity<FileTag>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string;

  @Property({length: 64})
  public name: string;

  @ManyToOne(() => User)
  public user: User;

  @Property()
  public time_created: Date;

  @Property({onUpdate: () => new Date(), nullable: true})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  //endregion ----- Instance methods -----

  //region    ----- Static properties -----

  //endregion ----- Static properties -----

  //region    ----- Endpoint methods -----

  @FileTag.get("/count", {user: true})
  @FileTag.bindParameter<Request.getCount>("name", ValidatorType.STRING, {max_length: 64})
  @FileTag.bindParameter<Request.getCount>("exclude", ValidatorType.UUID, {array: true})
  @FileTag.bindPagination(100, ["id", "name", "time_created"])
  public static async getCount({locals: {respond, user, params: {name, exclude}}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    const where: FilterQuery<FileTag> = {user, name: {$like: name}, id: {$nin: exclude}};
    if (!name) delete where.name;
    if (!exclude) delete where.id;

    return respond(await this.getRepository().count(where));
  }

  @FileTag.get("/", {user: true})
  @FileTag.bindParameter<Request.getMany>("name", ValidatorType.STRING, {max_length: 64})
  @FileTag.bindParameter<Request.getMany>("exclude", ValidatorType.UUID, {array: true})
  @FileTag.bindPagination(100, ["id", "name", "time_created"])
  public static async getMany({locals: {respond, user, params: {name, exclude, ...pagination}}}: Server.Request<{}, Response.getMany, Request.getMany>) {
    const where: FilterQuery<FileTag> = {user, name: {$like: name}, id: {$nin: exclude}};
    if (name) where.name = {$like: name};
    if (exclude) where.id = {$nin: exclude};

    return respond(await this.getRepository().find(where, {...pagination, populate: ["user"]}));
  }

  @FileTag.get("/:id", {user: true})
  public static async getOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    return respond(await this.getRepository().findOneOrFail({id, user}, {populate: ["user"]}));
  }

  @FileTag.get("/by-name/:name", {user: true})
  public static async getOneByName({params: {name}, locals: {respond, user}}: Server.Request<{name: string}, Response.getOne, Request.getOne>) {
    return respond(await this.getRepository().findOneOrFail({name, user}, {populate: ["user"]}));
  }

  @FileTag.post("/", {user: true})
  @FileTag.bindParameter<Request.postOne>("name", ValidatorType.STRING, {min_length: 3, max_length: 64})
  private static async postOne({locals: {respond, user, params: {name}}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    const file_tag_entity = this.getRepository().create({
      id:           v4(),
      user:         user,
      name:         name,
      time_created: new Date(),
      time_updated: null,
    });
    await this.getRepository().persistAndFlush(file_tag_entity);

    return respond(file_tag_entity);
  }

  @FileTag.delete("/:id", {user: true})
  private static async deleteOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.deleteOne, Request.deleteOne>) {
    const file_tag_entity = await this.getRepository().findOneOrFail({id, user}, {populate: ["user"]});
    await this.getRepository().remove(file_tag_entity);
    return respond(file_tag_entity);
  }

  //endregion ----- Endpoint methods -----

}

namespace Request {
  export type getCount = {name?: string, exclude?: string[]}
  export type getMany = getCount & Pagination
  export type getOne = {}
  export type postOne = {name: string, user_created: string}
  export type deleteOne = {}
}

namespace Response {
  export type getCount = number
  export type getMany = FileTag[] | ServerException
  export type getOne = FileTag | ServerException
  export type postOne = FileTag | ServerException
  export type deleteOne = FileTag | ServerException
}
