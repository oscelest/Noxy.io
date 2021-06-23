import Entity, {Pagination} from "../../../common/classes/Entity";
import ValidatorType from "../../../common/enums/ValidatorType";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";
import User from "../User";
import Privacy from "../../../common/enums/Privacy";
import File from "../File/File";
import {PrimaryKey, Property, Enum, ManyToOne, ManyToMany, Unique, Filter, Collection} from "@mikro-orm/core";
import {v4} from "uuid";
import {Entity as DBEntity} from "@mikro-orm/core/decorators/Entity";
import Database from "../../../common/services/Database";

@DBEntity()
@Unique({name: "path", properties: ["path"] as (keyof Page)[]})
@Filter({name: "find", cond: args => args.name ? {name: {$like: args.name}, user_created: args.user} : {user_created: args.user}})
export default class Page extends Entity<Page>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string = v4();

  @Property({length: 256})
  public path: string;

  @Property({length: 64})
  public name: string;

  @Property({type: "text"})
  public content: string;

  @Enum(() => Privacy)
  public privacy: Privacy;

  @Property({length: 32})
  public share_hash: string = Page.generateShareHash();

  @ManyToMany(() => File)
  public file_list: Collection<File> = new Collection<File>(this);

  @ManyToOne(() => User)
  public user: User;

  @Property()
  public time_created: Date = new Date();

  @Property({onUpdate: () => new Date()})
  public time_updated: Date = new Date();

  //endregion ----- Properties -----

  //region    ----- Utility methods -----

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @Page.get("/count")
  @Page.bindParameter<Request.getCount>("name", ValidatorType.STRING, {})
  public static async getCount({locals: {respond, user, params: {name}}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    return respond(await this.count(this.where({user}).andWildcard({name})));
  }

  @Page.get("/", {user: false})
  @Page.bindParameter<Request.getCount>("name", ValidatorType.STRING, {})
  @Page.bindPagination(100, ["id", "name", "time_created"])
  public static async getMany({locals: {respond, params: {name, ...pagination}}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    return respond(await this.find(
      this.where({privacy: Privacy.PUBLIC}).andWildcard({name}),
      {...pagination, populate: {user: true, file_list: ["file_extension"]}}),
    );
  }

  @Page.get("/:id")
  public static async getOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    return respond(await this.findOne({id, user}));
  }

  @Page.get("/by-path/:path")
  public static async getOneByPath({params: {path}, locals: {respond, user}}: Server.Request<{path: string}, Response.getOne, Request.getOne>) {
    return respond(await this.findOne({path, user}));
  }

  @Page.post("/")
  @Page.bindParameter<Request.postOne>("name", ValidatorType.STRING, {min_length: 1})
  @Page.bindParameter<Request.postOne>("path", ValidatorType.STRING, {validator: /^[a-z0-9_+-]+$/})
  @Page.bindParameter<Request.postOne>("content", ValidatorType.STRING, {}, {optional: true})
  @Page.bindParameter<Request.postOne>("privacy", ValidatorType.ENUM, Privacy, {optional: true})
  @Page.bindParameter<Request.postOne>("file_list", ValidatorType.UUID, {array: true, optional: true})
  private static async postOne({locals: {respond, user, params: {name, path, content, privacy, file_list}}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    return respond(await this.persist({
      name:      name,
      path:      path,
      content:   content ?? "",
      privacy:   privacy ?? Privacy.PRIVATE,
      user:      user!,
      file_list: new Collection<File>(file_list ? await Database.manager.find(File, {id: file_list}) : []),
    }));
  }

  @Page.put("/:id")
  @Page.bindParameter<Request.putOne>("path", ValidatorType.STRING, {min_length: 1}, {optional: true})
  @Page.bindParameter<Request.putOne>("name", ValidatorType.STRING, {min_length: 1}, {optional: true})
  @Page.bindParameter<Request.putOne>("content", ValidatorType.STRING, {min_length: 1}, {optional: true})
  @Page.bindParameter<Request.putOne>("privacy", ValidatorType.ENUM, Privacy, {optional: true})
  @Page.bindParameter<Request.putOne>("file_list", ValidatorType.UUID, {array: true, optional: true})
  private static async putOne({params: {id}, locals: {respond, user, params: {name, path, content, privacy, file_list}}}: Server.Request<{id: string}, Response.putOne, Request.putOne>) {
    const page = await this.findOne({id, user}, {populate: ["user"]});
    if (file_list && file_list.length) page.file_list.add(...await File.find({id: {$in: file_list}}));
    return respond(await this.persist(page, {path, name, content, privacy}));
  }

  //endregion ----- Endpoint methods -----

}

namespace Request {
  export type getCount = {name?: string}
  export type getFindMany = getCount & Pagination
  export type getOne = never
  export type postOne = {path: string; name: string; content: string; privacy?: Privacy; file_list?: string[]}
  export type putOne = {path?: string; name?: string; content?: string; privacy?: Privacy; file_list?: string[]}
}

namespace Response {
  export type getCount = number | ServerException
  export type getFindMany = Page[] | ServerException
  export type getOne = Page | ServerException
  export type postOne = Page | ServerException
  export type putOne = Page | ServerException
}

