import UserEntity from "../UserEntity";
import Axios from "axios";
import RequestData from "../../classes/RequestData";
import Order from "../../../common/enums/Order";
import Privacy from "../../../common/enums/Privacy";
import FileEntity from "../file/FileEntity";
import Helper from "../../Helper";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import PageBlockEntity from "./PageBlockEntity";

export default class PageEntity extends BaseEntity {

  public id: string;
  public path: string;
  public name: string;
  public summary: string;
  public block_list: PageBlockEntity[];
  public privacy: Privacy;
  public share_hash: string;
  public file_list: FileEntity[];
  public user: UserEntity;
  public time_created: Date;
  public time_updated: Date;

  public static URL = "page";

  constructor(entity?: Initializer<PageEntity>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.path = entity?.path ?? "";
    this.name = entity?.name ?? "";
    this.summary = entity?.summary ?? "";
    this.block_list = PageBlockEntity.instantiate(entity?.block_list);
    this.privacy = entity?.privacy ?? Privacy.PRIVATE;
    this.file_list = FileEntity.instantiate(entity?.file_list);
    this.user = new UserEntity(entity?.user);
    this.time_created = new Date(entity?.time_created ?? 0);
    this.time_updated = new Date(entity?.time_updated ?? 0);
  }

  public toString() {
    return this.getPrimaryID();
  }

  public getPrimaryID(): string {
    return this.id;
  }

  public static async getCount(search: PageEntitySearchParameters = {}) {
    const result = await Axios.get<APIRequest<number>>(Helper.getAPIPath(this.URL, `count?${new RequestData(search).toString()}`));
    return result.data.content;
  }

  public static async getMany(search: PageEntitySearchParameters = {}, pagination: RequestPagination<PageEntity> = {skip: 0, limit: 10, order: {time_created: Order.ASC}}) {
    const result = await Axios.get<APIRequest<PageEntity[]>>(Helper.getAPIPath(`${this.URL}?${new RequestData(search).paginate(pagination).toString()}`));
    return this.instantiate(result.data.content);
  }

  public static async getOne(id: string | PageEntity) {
    const result = await Axios.get<APIRequest<PageEntity>>(Helper.getAPIPath(this.URL, id.toString()));
    return new this(result.data.content);
  }

  public static async getOneByPath(id: string | PageEntity) {
    const result = await Axios.get<APIRequest<PageEntity>>(Helper.getAPIPath(this.URL, "by-path", id.toString()));
    return new this(result.data.content);
  }

  public static async postOne({name, path}: PageEntity) {
    const result = await Axios.post<APIRequest<PageEntity>>(Helper.getAPIPath(this.URL), new RequestData({name, path}).toObject());
    return new this(result.data.content);
  }

  public static async putOne(id: string | PageEntity, parameters: PageEntityUpdateParameters) {
    const result = await Axios.put<APIRequest<PageEntity>>(Helper.getAPIPath(this.URL, id.toString()), new RequestData(parameters).toObject());
    return new this(result.data.content);
  }
}

export type PageEntitySearchParameters = {
  name?: string
  flag_public?: boolean
  exclude?: string | string[] | PageEntity | PageEntity[]
}

export type PageEntityCreateParameters = {
  name: string
}

export type PageEntityUpdateParameters = {
  name?: string
  path?: string
  privacy?: Privacy
}
