import Entity, {Pagination, Populate} from "../../../common/classes/Entity/Entity";
import ValidatorType from "../../../common/enums/ValidatorType";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";
import User from "../User";
import Privacy from "../../../common/enums/Privacy";
import File from "../File/File";
import {PrimaryKey, Property, Enum, ManyToOne, ManyToMany, Unique, Collection, OneToMany, Cascade} from "@mikro-orm/core";
import {v4} from "uuid";
import {Entity as DBEntity} from "@mikro-orm/core/decorators/Entity";
import Database from "../../../common/services/Database";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import PageBlock from "./PageBlock";

@DBEntity()
@Unique({name: "path", properties: ["path"] as (keyof Page)[]})
export default class Page extends Entity<Page>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string = v4();

  @Property({length: 64})
  public name: string;

  @Property({length: 256})
  public path: string;

  @Property({length: 256})
  public summary: string;

  @OneToMany(() => PageBlock, entity => entity.page, {cascade: [Cascade.ALL]})
  public block_list: Collection<PageBlock> = new Collection<PageBlock>(this);

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

  //region    ----- Static properties -----

  public static columnPopulate: Populate<Page> = {user: true, block_list: true, file_list: ["file_extension"]};

  //endregion ----- Static properties -----

  //region    ----- Endpoint methods -----

  @Page.get("/count")
  @Page.bindParameter<Request.getCount>("name", ValidatorType.STRING, {})
  @Page.bindParameter<Request.getCount>("flag_public", ValidatorType.BOOLEAN, {})
  public static async getCount({locals: {respond, user, params: {name, flag_public}}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    const where = this.where().andOr({privacy: Privacy.PUBLIC}).andWildcard({name});
    if (!flag_public) where.andOr({privacy: Privacy.LINK, user}, {privacy: Privacy.PRIVATE, user});

    return respond(await this.count(where));
  }

  @Page.get("/", {user: false})
  @Page.bindParameter<Request.getCount>("name", ValidatorType.STRING, {})
  @Page.bindParameter<Request.getCount>("flag_public", ValidatorType.BOOLEAN, {})
  @Page.bindPagination(100, ["id", "name", "time_created"])
  public static async getMany({locals: {respond, user, params: {name, flag_public, ...pagination}}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const where = this.where().andOr({privacy: Privacy.PUBLIC}).andWildcard({name});
    if (!flag_public) where.andOr({privacy: Privacy.LINK, user}, {privacy: Privacy.PRIVATE, user});

    return respond(await this.find(where, {...pagination, populate: this.columnPopulate}));
  }

  @Page.get("/:id")
  @Page.bindParameter<Request.getOne>("share_hash", ValidatorType.STRING, {validator: BaseEntity.regexShareHash})
  public static async getOne({params: {id}, locals: {respond, user, params: {share_hash}}}: Server.Request<{id: string}, Response.getOne, Request.getOne>) {
    return respond(await this.findOne(
      this.where({id}).andOr({privacy: Privacy.PRIVATE, user}, {privacy: Privacy.PUBLIC}, {privacy: Privacy.LINK, share_hash}),
      {populate: this.columnPopulate},
    ));
  }

  @Page.get("/by-path/:path")
  @Page.bindParameter<Request.getOne>("share_hash", ValidatorType.STRING, {validator: BaseEntity.regexShareHash})
  public static async getOneByPath({params: {path}, locals: {respond, user, params: {share_hash}}}: Server.Request<{path: string}, Response.getOne, Request.getOne>) {
    return respond(await this.findOne(
      this.where({path}).andOr({privacy: Privacy.PRIVATE, user}, {privacy: Privacy.PUBLIC}, {privacy: Privacy.LINK, share_hash}),
      {populate: this.columnPopulate},
    ));
  }

  @Page.post("/")
  @Page.bindParameter<Request.postOne>("name", ValidatorType.STRING, {min_length: 1})
  @Page.bindParameter<Request.postOne>("path", ValidatorType.STRING, {validator: /^[a-z0-9_+-]+$/})
  @Page.bindParameter<Request.postOne>("privacy", ValidatorType.ENUM, Privacy, {optional: true})
  @Page.bindParameter<Request.postOne>("file_list", ValidatorType.UUID, {array: true, optional: true})
  private static async postOne({locals: {respond, user, params: {name, path, privacy, file_list}}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    return respond(await this.persist({
      name:      name,
      path:      path,
      summary:   "",
      privacy:   privacy ?? Privacy.PRIVATE,
      user:      user,
      file_list: new Collection<File>(file_list ? await Database.manager.find(File, {id: file_list}) : []),
    }));
  }

  @Page.put("/:id")
  @Page.bindParameter<Request.putOne>("name", ValidatorType.STRING, {min_length: 1}, {optional: true})
  @Page.bindParameter<Request.putOne>("path", ValidatorType.STRING, {min_length: 1}, {optional: true})
  @Page.bindParameter<Request.putOne>("privacy", ValidatorType.ENUM, Privacy, {optional: true})
  @Page.bindParameter<Request.putOne>("file_list", ValidatorType.UUID, {array: true, optional: true})
  private static async putOne({params: {id}, locals: {respond, user, params: {name, path, content, privacy, file_list}}}: Server.Request<{id: string}, Response.putOne, Request.putOne>) {
    const page = await this.findOne({id, user}, {populate: this.columnPopulate});
    if (file_list && file_list.length) page.file_list.add(...await File.find({id: {$in: file_list}}));
    return respond(await this.persist(page, {path, name, privacy}));
  }

  //endregion ----- Endpoint methods -----

}

namespace Request {
  export type getCount = {name?: string, flag_public?: boolean}
  export type getFindMany = getCount & Pagination
  export type getOne = {share_hash?: string}
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

