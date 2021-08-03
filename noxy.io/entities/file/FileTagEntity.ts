import Axios, {AxiosError} from "axios";
import Order from "../../../common/enums/Order";
import RequestData from "../../classes/RequestData";
import UserEntity from "../UserEntity";
import Helper from "../../Helper";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";

export default class FileTagEntity extends BaseEntity {

  public id: string;
  public name: string;
  public user: UserEntity;
  public time_created: Date;

  public static URL = "file-tag";

  constructor(entity?: Initializer<FileTagEntity>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.name = entity?.name ?? "";
    this.user = new UserEntity(entity?.user);
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return this.getPrimaryID();
  }

  public getPrimaryID(): string {
    return this.id;
  }

  public static render(file_tag: FileTagEntity) {
    return file_tag.name;
  }

  public static async getCount(search: TagEntitySearchParameter = {}) {
    const result = await Axios.get<APIRequest<number>>(Helper.getAPIPath(this.URL, `count?${new RequestData(search).toString()}`));
    return result.data.content;
  }

  public static async getMany(search: TagEntitySearchParameter = {}, pagination: RequestPagination<FileTagEntity> = {skip: 0, limit: 10, order: {name: Order.ASC}}) {
    const result = await Axios.get<APIRequest<FileTagEntity[]>>(Helper.getAPIPath(`${this.URL}?${new RequestData(search).paginate(pagination).toString()}`));
    return this.instantiate(result.data.content);
  }

  public static async getOne(id: string | FileTagEntity) {
    const result = await Axios.get<APIRequest<FileTagEntity>>(Helper.getAPIPath(this.URL, id.toString()));
    return new this(result.data.content);
  }

  public static async getOneByName(name: string) {
    const result = await Axios.get<APIRequest<FileTagEntity>>(Helper.getAPIPath(this.URL, "/by-name/", name));
    return new this(result.data.content);
  }

  public static async createOne(parameters: FileTagEntityCreateParameters, ...caches: FileTagEntity[][]) {
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
        const response = await Axios.post<APIRequest<FileTagEntity>>(Helper.getAPIPath(this.URL), new RequestData(parameters).toObject());
        result = new this(response.data.content);
      }

      return result;
    }
    catch (error) {
      const exception = error as AxiosError;
      if (exception.response?.status === 409) return await FileTagEntity.getOneByName(parameters.name);
      throw exception;
    }
  }

  public static async deleteOne(id: string | FileTagEntity) {
    const result = await Axios.delete<APIRequest<FileTagEntity>>(Helper.getAPIPath(this.URL, id.toString()));
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
