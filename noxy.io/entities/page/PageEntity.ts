import Entity from "../../classes/Entity";
import UserEntity from "../UserEntity";
import Axios from "axios";
import RequestData from "../../classes/RequestData";
import Order from "../../../common/enums/Order";
import Privacy from "../../../common/enums/Privacy";
import FileEntity from "../file/FileEntity";

export default class PageEntity extends Entity {

  public id: string;
  public path: string;
  public name: string;
  public content: string;
  public privacy: Privacy;
  public share_hash: string;
  public file_list: FileEntity[];
  public user: UserEntity;
  public time_created: Date;
  public time_updated: Date;

  public static URL = `${Entity.domainAPI}/page`;

  constructor(entity?: Initializer<PageEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.path = entity?.path ?? "";
    this.name = entity?.name ?? "";
    this.content = entity?.content ?? "";
    this.privacy = entity?.privacy ?? Privacy.PRIVATE;
    this.file_list = FileEntity.instantiate(entity?.file_list);
    this.user = new UserEntity(entity?.user);
    this.time_created = new Date(entity?.time_created ?? 0);
    this.time_updated = new Date(entity?.time_updated ?? 0);
  }

  public toString() {
    return this.name;
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async count(search: PageEntitySearchParameters = {}) {
    const result = await Axios.get<APIRequest<number>>(`${this.URL}/count?${new RequestData(search)}`);
    return result.data.content;
  }

  public static async findMany(search: PageEntitySearchParameters = {}, pagination: RequestPagination<PageEntity> = {skip: 0, limit: 10, order: {time_created: Order.ASC}}) {
    const result = await Axios.get<APIRequest<PageEntity[]>>(`${this.URL}?${new RequestData(search).paginate(pagination)}`);
    return this.instantiate(result.data.content);
  }

  public static async findOne(entity: string | PageEntity) {
    const id = entity instanceof PageEntity ? entity.id : entity;
    const result = await Axios.get<APIRequest<PageEntity>>(`${this.URL}/${id}`);
    return new this(result.data.content);
  }

  public static async findOneByPath(entity: string | PageEntity) {
    const result = await Axios.get<APIRequest<PageEntity>>(`${this.URL}/by-path/${entity instanceof PageEntity ? entity.id : entity}`);
    return new this(result.data.content);
  }

  public static async createOne({name, path}: PageEntity) {
    const result = await Axios.post<APIRequest<PageEntity>>(this.URL, new RequestData({name, path}).toObject());
    return new this(result.data.content);
  }

  public static async updateOne(entity: string | PageEntity, parameters: PageEntityUpdateParameters) {
    const id = entity instanceof Entity ? entity.id : entity;
    const result = await Axios.put<APIRequest<PageEntity>>(`${this.URL}/${id}`, new RequestData(parameters).toObject());
    return new this(result.data.content);
  }
}

export type PageEntitySearchParameters = {
  name?: string
  exclude?: string | string[] | PageEntity | PageEntity[]
}

export type PageEntityCreateParameters = {
  name: string
}

export type PageEntityUpdateParameters = {
  name?: string
  privacy?: Privacy
  content?: string
}
