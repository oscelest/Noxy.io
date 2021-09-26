import Axios from "axios";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import Order from "../../../common/enums/Order";
import PageBlockType from "../../../common/enums/PageBlockType";
import RequestData from "../../classes/RequestData";
import RichText from "../../classes/RichText";
import Helper from "../../Helper";
import {APIKeyEntitySearchParameters} from "../APIKeyEntity";
import {HeaderBlockContent} from "./Block/HeaderPageBlockEntity";
import {ListBlockContent} from "./Block/ListPageBlockEntity";
import {TableBlockContent} from "./Block/TablePageBlockEntity";
import PageEntity from "./PageEntity";

export default abstract class PageBlockEntity<Type extends PageBlockType = PageBlockType> extends BaseEntity {
  
  public id: string;
  public type: Type;
  public content: PageBlockContent[Type];
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
  
  public static async get(search: APIKeyEntitySearchParameters = {}, pagination: RequestPagination<PageBlockEntity> = {skip: 0, limit: 10, order: {time_created: Order.DESC}}) {
    const result = await Axios.get<APIRequest<Array<PageBlockEntity & {content: any}>>>(Helper.getAPIPath(`${this.url}?${new RequestData(search).paginate(pagination).toString()}`));
    return await Promise.all(result.data.content.map(async value => await PageEntity.parsePageBlock(value)));
  }
  
  public static parseContentText = <T>(input?: ContentInitializer<RichText<T>>): RichText<T> => {
    if (input instanceof RichText) return input;
    if (typeof input === "string") return RichText.parseHTML(input);
    return new RichText({value: ""});
  };
  
  public static parseContentNumber = (input?: number) => {
    return (typeof input !== "number" || isNaN(+input)) ? 0 : input;
  };
  
}

export interface PageBlockContentValue<T = never> {
  value: RichText<T> | DeepArray<RichText<T>>;
}

interface PageBlockContent {
  [PageBlockType.TEXT]: TextBlockContent;
  [PageBlockType.LIST]: ListBlockContent;
  [PageBlockType.TABLE]: TableBlockContent;
  [PageBlockType.HEADER]: HeaderBlockContent;
}

export type ContentInitializer<T> = T extends Array<infer R> ? Array<ContentInitializer<R>> :
                                    T extends RichText<infer K> ? RichText<K> | string :
                                    T extends object ? { [K in keyof T]?: ContentInitializer<T[K]> } :
                                    T

type ContentValue<T> = T extends Array<infer R> ? ContentValue<R> : T extends RichText<infer K> ? RichText<K> : T

export interface TextBlockContent extends PageBlockContentValue {
  value: RichText;
}








