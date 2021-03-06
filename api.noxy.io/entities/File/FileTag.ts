import {Entity as DBEntity, PrimaryKey, Property, Index, Unique, ManyToOne} from "@mikro-orm/core";
import {v4} from "uuid";
import User from "../User";
import Entity, {Pagination, Populate} from "../../../common/classes/Entity/Entity";
import ValidatorType from "../../../common/enums/ValidatorType";
import ServerException from "../../../common/exceptions/ServerException";
import Server from "../../../common/services/Server";

@DBEntity()
@Unique({name: "file_tag", properties: ["name", "user"] as (keyof FileTag)[]})
@Index({name: "time_created", properties: ["time_created"] as (keyof FileTag)[]})
@Index({name: "time_updated", properties: ["time_updated"] as (keyof FileTag)[]})
export default class FileTag extends Entity<FileTag>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string = v4();

  @Property({length: 64})
  public name: string;

  @ManyToOne(() => User)
  public user: User;

  @Property()
  public time_created: Date = new Date();

  @Property({onUpdate: () => new Date()})
  public time_updated: Date = new Date();

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  //endregion ----- Instance methods -----

  //region    ----- Static properties -----

  public static columnPopulate: Populate<FileTag> = ["user"];

  //endregion ----- Static properties -----

  //region    ----- Endpoint methods -----

  @FileTag.get("/count")
  @FileTag.bindParameter<Request.getCount>("name", ValidatorType.STRING, {max_length: 64})
  @FileTag.bindParameter<Request.getCount>("exclude", ValidatorType.UUID, {array: true})
  @FileTag.bindPagination(100, ["id", "name", "time_created"])
  public static async getCount({locals: {respond, user, params: {name, exclude}}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    return respond(await this.count(this.where({user}).andExclusion({id: exclude}).andWildcard({name})));
  }

  @FileTag.get("/")
  @FileTag.bindParameter<Request.getMany>("name", ValidatorType.STRING, {max_length: 64})
  @FileTag.bindParameter<Request.getMany>("exclude", ValidatorType.UUID, {array: true})
  @FileTag.bindPagination(100, ["id", "name", "time_created"])
  public static async getMany({locals: {respond, user, params: {name, exclude, ...pagination}}}: Server.Request<{}, Response.getMany, Request.getMany>) {
    return respond(await this.find(this.where({user}).andExclusion({id: exclude}).andWildcard({name}), {...pagination, populate: this.columnPopulate}));
  }

  @FileTag.get("/:id")
  public static async getOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    return respond(await this.findOne(this.where({id, user}), {populate: this.columnPopulate}));
  }

  @FileTag.get("/by-name/:name")
  public static async getOneByName({params: {name}, locals: {respond, user}}: Server.Request<{name: string}, Response.getOne, Request.getOne>) {
    return respond(await this.findOne({name, user}, {populate: this.columnPopulate}));
  }

  @FileTag.post("/")
  @FileTag.bindParameter<Request.postOne>("name", ValidatorType.STRING, {min_length: 3, max_length: 64})
  private static async postOne({locals: {respond, user, params: {name}}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    return respond(await this.persist({name, user}));
  }

  @FileTag.delete("/:id")
  private static async deleteOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.deleteOne, Request.deleteOne>) {
    return respond(await this.remove({id, user}, {populate: this.columnPopulate}));
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
