import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import Pagination from "../../../common/classes/Pagination";
import Order from "../../../common/enums/Order";
import PageBlockType from "../../../common/enums/PageBlockType";
import Fetch from "../../classes/Fetch";
import RichText from "../../classes/RichText/RichText";
import {APIKeyEntitySearchParameters} from "../APIKeyEntity";
import {HeaderBlockContent} from "./Block/HeaderPageBlockEntity";
import {ListBlockContent} from "./Block/ListPageBlockEntity";
import {TableBlockContent} from "./Block/TablePageBlockEntity";
import {TextBlockContent} from "./Block/TextPageBlockEntity";
import PageEntity from "./PageEntity";

export default abstract class PageBlockEntity<Type extends PageBlockType = PageBlockType> extends BaseEntity {
  
  public id: string;
  public type: Type;
  public weight: number;
  public page: PageEntity;
  public time_created: Date;
  public time_updated: Date;
  
  public static url = "page-block";
  
  protected constructor(entity?: Initializer<PageBlockEntity<Type>>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.weight = entity?.weight ?? 0;
    this.page = new PageEntity(entity?.page);
    this.time_created = new Date(entity?.time_created ?? 0);
    this.time_updated = new Date(entity?.time_updated ?? 0);
  }
  
  public toString() {
    return this.getPrimaryID();
  }
  
  public getPrimaryID(): string {
    return this.id;
  }
  
  public abstract replaceText(old_text: ContentValue<PageBlockContent[Type]["value"]>, new_text: ContentValue<PageBlockContent[Type]["value"]>): this
  
  public static async get(search: APIKeyEntitySearchParameters = {}, pagination: Pagination<PageBlockEntity> = new Pagination<PageBlockEntity>(0, 10, {time_created: Order.DESC})) {
    const result = await Fetch.get<Array<PageBlockEntity & {content: any}>>(`${this.url}`, {...search, ...pagination.toObject()});
    return await Promise.all(result.content.map(async value => await PageEntity.parsePageBlock(value)));
  }
}

export interface PageBlockContent {
  [PageBlockType.TEXT]: TextBlockContent;
  [PageBlockType.LIST]: ListBlockContent;
  [PageBlockType.TABLE]: TableBlockContent;
  [PageBlockType.HEADER]: HeaderBlockContent;
}

export interface PageBlockInitializer<Type extends PageBlockType = PageBlockType> extends Initializer<Omit<PageBlockEntity, "type">> {

}

type ContentValue<T> = T extends Array<infer R> ? ContentValue<R> : T extends RichText ? RichText : T







