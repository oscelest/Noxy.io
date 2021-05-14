import Axios from "axios";
import _ from "lodash";
import FileTypeName from "../../common/enums/FileTypeName";
import Order from "../../common/enums/Order";
import Entity from "../classes/Entity";
import RequestData from "../classes/RequestData";

export default class FileTypeEntity extends Entity {

  public id: string;
  public name: FileTypeName;
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/file-type`;

  constructor(entity?: EntityInitializer<FileTypeEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.name = entity?.name ?? FileTypeName.APPLICATION;
    this.time_created = entity?.time_created ?? new Date();
  }

  public toString() {
    return _.capitalize(this.name);
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async count(search: FileTypeEntityFindMany = {}) {
    try {
      return await Axios.get<APIRequest<number>>(`${this.URL}/count?${new RequestData(search)}`);
    }
    catch (error) {
      throw error;
    }
  }

  public static async findMany(search: FileTypeEntityFindMany = {}, pagination: RequestPagination<FileTypeEntity> = {skip: 0, limit: 10, order: {time_created: Order.ASC}}) {
    try {
      const result = await Axios.get<APIRequest<FileTypeEntity[]>>(`${this.URL}?${new RequestData(search).paginate(pagination)}`);
      return this.instantiate(result.data.content);
    }
    catch (error) {
      throw error;
    }
  }

  public static async findManyByUnique(search: string | string[]) {
    try {
      const result = await Axios.get<APIRequest<FileTypeEntity[]>>(`${this.URL}/by-unique?${new RequestData({search})}`);
      return this.instantiate(result.data.content);
    }
    catch (error) {
      throw error;
    }
  }

}

type FileTypeEntityFindMany = {
  name?: string

  exclude?: FileTypeEntity | FileTypeEntity[]
}

