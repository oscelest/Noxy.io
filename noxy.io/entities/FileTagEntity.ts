import Axios from "axios";
import Order from "../../common/enums/Order";
import Entity from "../classes/Entity";
import RequestData from "../classes/RequestData";
import UserEntity from "./UserEntity";

export default class FileTagEntity extends Entity {

  public id: string;
  public name: string;
  public size: number;
  public user_created: UserEntity;
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/file-tag`;

  constructor(entity?: Properties<FileTagEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.name = entity?.name ?? "";
    this.size = entity?.size ?? 0;
    this.user_created = new UserEntity(entity?.user_created);
    this.time_created = entity?.time_created ?? new Date();
  }

  public toString() {
    return this.name;
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async count(search: TagEntitySearchParameter = {}) {
    try {
      return await Axios.get<APIRequest<number>>(`${this.URL}/count?${new RequestData(search)}`);
    }
    catch (error) {
      throw error;
    }
  }

  public static async findMany(search: TagEntitySearchParameter = {}, pagination: RequestPagination<FileTagEntity> = {skip: 0, limit: 10, order: {name: Order.ASC}}) {
    try {
      const result = await Axios.get<APIRequest<FileTagEntity[]>>(`${this.URL}?${new RequestData(search).paginate(pagination)}`);
      return this.instantiate(result.data.content);
    }
    catch (error) {
      throw error;
    }
  }

  public static async createOne(parameters: FileTagEntityCreateParameters) {
    try {
      const result = await Axios.post<APIRequest<FileTagEntity>>(this.URL, new RequestData(parameters).toObject());
      return new this(result.data.content);
    }
    catch (error) {
      throw error;
    }
  }

  public static async deleteByID(id: string) {
    try {
      const result = await Axios.delete<APIRequest<FileTagEntity>>(`${this.URL}/${id}`);
      return new this(result.data.content);
    }
    catch (error) {
      throw error;
    }
  }

}

type TagEntitySearchParameter = {
  name?: string
  exclude?: FileTagEntity[]
}

type FileTagEntityCreateParameters = {
  name: string
}
