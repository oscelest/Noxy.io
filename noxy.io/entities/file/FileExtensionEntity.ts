import Axios from "axios";
import Order from "../../../common/enums/Order";
import Entity from "../../classes/Entity";
import RequestData from "../../classes/RequestData";
import FileTypeEntity from "./FileTypeEntity";

export default class FileExtensionEntity extends Entity {

  public id: string;
  public name: string;
  public file_type: FileTypeEntity;
  public mime_type: string;
  public time_created: Date;

  constructor(entity?: Initializer<FileExtensionEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.name = entity?.name ?? "";
    this.file_type = new FileTypeEntity(entity?.file_type);
    this.mime_type = entity?.mime_type ?? "";
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return this.name;
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async findMany(search: ExtensionEntitySearchParameter = {}, pagination: RequestPagination<FileExtensionEntity> = {skip: 0, limit: 10, order: {name: Order.ASC}}) {
    try {
      const result = await Axios.get<APIRequest<FileExtensionEntity[]>>(`${this.URL}?${new RequestData(search).paginate(pagination)}`);
      return this.instantiate(result.data.content);
    }
    catch (error) {
      throw error;
    }
  }

}

type ExtensionEntitySearchParameter = {
  name?: string
  type?: string
  subtype?: string

  exclude?: FileExtensionEntity | FileExtensionEntity[]
}
