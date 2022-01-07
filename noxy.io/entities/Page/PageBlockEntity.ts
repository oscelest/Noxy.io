import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import Pagination from "../../../common/classes/Pagination";
import Order from "../../../common/enums/Order";
import PageBlockType from "../../../common/enums/PageBlockType";
import Fetch from "../../classes/Fetch";
import {APIKeyEntitySearchParameters} from "../APIKeyEntity";
import PageEntity from "./PageEntity";

export default class PageBlockEntity<Content = any> extends BaseEntity {

  public id: string;
  public type: PageBlockType;
  public weight: number;
  public content: Content | undefined;
  public page: PageEntity;
  public time_created: Date;
  public time_updated: Date;

  public static url = "page-block";

  constructor(entity?: PageBlockEntityInitializer<Content>) {
    super();

    this.id = entity?.id ?? BaseEntity.defaultID;
    this.type = entity?.type ?? PageBlockType.TEXT;
    this.weight = entity?.weight ?? 0;
    this.content = entity?.content;
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

  public static async get(search: APIKeyEntitySearchParameters = {}, pagination: Pagination<PageBlockEntity> = new Pagination<PageBlockEntity>(0, 10, {time_created: Order.DESC})) {
    const result = await Fetch.get<Array<PageBlockEntity & {content: any}>>(`${this.url}`, {...search, ...pagination.toObject()});
    return result.content;
  }
}

export interface PageBlockEntityInitializer<Content> extends Initializer<PageBlockEntity> {
  content?: Content
}
