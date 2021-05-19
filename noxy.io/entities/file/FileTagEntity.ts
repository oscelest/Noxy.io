import Axios, {AxiosError} from "axios";
import Order from "../../../common/enums/Order";
import Entity from "../../classes/Entity";
import RequestData from "../../classes/RequestData";
import UserEntity from "../UserEntity";

export default class FileTagEntity extends Entity {

  public id: string;
  public name: string;
  public user_created: UserEntity;
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/file-tag`;

  constructor(entity?: EntityInitializer<FileTagEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.name = entity?.name ?? "";
    this.user_created = new UserEntity(entity?.user_created);
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return this.name;
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async count(search: TagEntitySearchParameter = {}) {
    return await Axios.get<APIRequest<number>>(`${this.URL}/count?${new RequestData(search)}`);
  }

  public static async findMany(search: TagEntitySearchParameter = {}, pagination: RequestPagination<FileTagEntity> = {skip: 0, limit: 10, order: {name: Order.ASC}}) {
    const result = await Axios.get<APIRequest<FileTagEntity[]>>(`${this.URL}?${new RequestData(search).paginate(pagination)}`);
    return this.instantiate(result.data.content);
  }

  public static async findOne(id: string | FileTagEntity) {
    id = typeof id === "string" ? id : id.getPrimaryKey();
    const result = await Axios.get<APIRequest<FileTagEntity>>(`${this.URL}/${id}`);
    return new this(result.data.content);
  }

  public static async findOneByName(name: string | FileTagEntity) {
    name = typeof name === "string" ? name : name.name;
    const result = await Axios.get<APIRequest<FileTagEntity>>(`${this.URL}/by-name/${name}`);
    return new this(result.data.content);
  }

  public static async createOne(parameters: FileTagEntityCreateParameters, ... caches: FileTagEntity[][]) {
    let result: FileTagEntity | undefined = undefined;

    try {
      if (caches.length) {
        for (let cache of caches) {
          for (let tag of cache) {
            if (tag.name.toLowerCase() === parameters.name.toLowerCase()) {
              result = tag;
              break;
            }
          }
          if (result !== undefined) break;
        }
      }

      if (result === undefined) {
        const response = await Axios.post<APIRequest<FileTagEntity>>(this.URL, new RequestData(parameters).toObject());
        result = new this(response.data.content)
      }

      return result;
    }
    catch (error) {
      const exception = error as AxiosError;
      if (exception.response?.status === 409) return await FileTagEntity.findOneByName(parameters.name);
      throw exception;
    }
  }

  public static async deleteOne(id: string | FileTagEntity) {
    id = typeof id === "string" ? id : id.getPrimaryKey();
    const result = await Axios.delete<APIRequest<FileTagEntity>>(`${this.URL}/${id}`);
    return new this(result.data.content);
  }

}

type TagEntitySearchParameter = {
  name?: string
  exclude?: FileTagEntity[]
}

type FileTagEntityCreateParameters = {
  name: string
}
