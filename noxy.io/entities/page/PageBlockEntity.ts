import Axios from "axios";
import RequestData from "../../classes/RequestData";
import Helper from "../../Helper";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import PageBlockType from "../../../common/enums/PageBlockType";
import PageEntity from "./PageEntity";

export default class PageBlockEntity<O extends {} = {}> extends BaseEntity {

  public id: string;
  public type: PageBlockType;
  public content: O;
  public weight: number;
  public page: PageEntity;
  public time_created: Date;
  public time_updated: Date;

  public static URL = "page-block";

  constructor(entity?: Initializer<PageBlockEntity<O>>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.type = entity?.type ?? PageBlockType.TEXT;
    this.weight = entity?.weight ?? 0;
    this.content = (entity as Partial<PageBlockEntity<O>>)?.content ?? {} as O;
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

  public static async postOne({page, weight, content, type}: Pick<Initializer<PageBlockEntity>, "type" | "content" | "weight" | "page">) {
    const result = await Axios.post<APIRequest<PageBlockEntity>>(Helper.getAPIPath(this.URL), new RequestData({page, weight, content, type}).toObject());
    return new this(result.data.content);
  }

  public static async putOne({content, weight}: PageBlockEntity): Promise<PageBlockEntity>
  public static async putOne(id: string, initializer: Pick<Initializer<PageBlockEntity>, "content" | "weight">): Promise<PageBlockEntity>
  public static async putOne(id: string | PageBlockEntity, initializer: Pick<Initializer<PageBlockEntity>, "content" | "weight"> = {}) {
    const {content, weight} = id instanceof PageBlockEntity ? id : initializer;
    const result = await Axios.put<APIRequest<PageBlockEntity>>(Helper.getAPIPath(this.URL, id.toString()), new RequestData({content, weight}).toObject());
    return new this(result.data.content);
  }
}


