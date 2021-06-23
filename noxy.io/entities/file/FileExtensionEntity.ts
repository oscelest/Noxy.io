import Axios from "axios";
import Order from "../../../common/enums/Order";
import RequestData from "../../classes/RequestData";
import FileTypeName from "../../../common/enums/FileTypeName";
import Helper from "../../Helper";
import BaseEntity from "../../../common/classes/BaseEntity";

export default class FileExtensionEntity extends BaseEntity {

  public id: string;
  public name: string;
  public type: FileTypeName;
  public mime_type: string;
  public time_created: Date;

  public static URL = "file-extension";

  constructor(entity?: Initializer<FileExtensionEntity>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.name = entity?.name ?? "";
    this.type = entity?.type ?? FileTypeName.UNKNOWN;
    this.mime_type = entity?.mime_type ?? "";
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public getPrimaryID(): string {
    return this.id;
  }

  public static async findMany(search: ExtensionEntitySearchParameter = {}, pagination: RequestPagination<FileExtensionEntity> = {skip: 0, limit: 10, order: {name: Order.ASC}}) {
    try {
      const result = await Axios.get<APIRequest<FileExtensionEntity[]>>(Helper.getAPIPath(this.URL, "?", new RequestData(search).paginate(pagination).toString()));
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
