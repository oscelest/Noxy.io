import Entity, {Pagination, Populate} from "../../../common/classes/Entity/Entity";
import ValidatorType from "../../../common/enums/ValidatorType";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";
import {PrimaryKey, Property, ManyToOne, Enum} from "@mikro-orm/core";
import {v4} from "uuid";
import {Entity as DBEntity} from "@mikro-orm/core/decorators/Entity";
import Page from "./Page";
import PageBlockType from "../../../common/enums/PageBlockType";

@DBEntity()
export default class PageBlock extends Entity<PageBlock>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string = v4();

  @Enum(() => PageBlockType)
  public type: PageBlockType;

  @Property()
  public weight: number;

  @Property({type: "json"})
  public content: object;

  @ManyToOne(() => Page)
  public page: Page;

  @Property()
  public time_created: Date = new Date();

  @Property({onUpdate: () => new Date()})
  public time_updated: Date = new Date();

  //endregion ----- Properties -----

  //region    ----- Static properties -----

  public static columnPopulate: Populate<PageBlock> = {page: {user: true}};

  //endregion ----- Static properties -----

  //region    ----- Endpoint methods -----

  @PageBlock.post("/")
  @PageBlock.bindParameter<Request.postOne>("type", ValidatorType.ENUM, PageBlockType)
  @PageBlock.bindParameter<Request.postOne>("content", ValidatorType.STRING)
  @PageBlock.bindParameter<Request.postOne>("weight", ValidatorType.INTEGER, {min: 0})
  @PageBlock.bindParameter<Request.postOne>("page", ValidatorType.UUID)
  private static async postOne({locals: {respond, user, params: {type, content, weight, page}}}: Server.Request<{}, Response.postOne, Request.postOne>) {
    const entity = await Page.findOne({id: page});
    if (entity.user.id !== user.id) return respond(new ServerException(403));
    return respond(await this.persist({type, content: JSON.parse(content), weight, page: entity}));
  }

  @PageBlock.put("/:id")
  @PageBlock.bindParameter<Request.putOne>("content", ValidatorType.STRING, {min_length: 1}, {optional: true})
  @PageBlock.bindParameter<Request.postOne>("weight", ValidatorType.INTEGER, {min: 0}, {optional: true})
  private static async putOne({params: {id}, locals: {respond, user, params: {content, weight}}}: Server.Request<{id: string}, Response.putOne, Request.putOne>) {
    const page_block = await this.findOne({id}, {populate: this.columnPopulate});
    if (page_block.page.user.id !== user.id) return respond(new ServerException(403));
    if (content !== undefined) page_block.content = JSON.parse(content);
    if (weight !== undefined) page_block.weight = weight;
    return respond(await this.persist(page_block));
  }

  //endregion ----- Endpoint methods -----

}

namespace Request {
  export type getCount = {name?: string}
  export type getFindMany = getCount & Pagination
  export type getOne = {share_hash?: string}
  export type postOne = {type: PageBlockType; content: string; weight: number; page: string}
  export type putOne = {content: string; weight: number}
}

namespace Response {
  export type getCount = number | ServerException
  export type getFindMany = PageBlock[] | ServerException
  export type getOne = PageBlock | ServerException
  export type postOne = PageBlock | ServerException
  export type putOne = PageBlock | ServerException
}

