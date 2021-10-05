import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import Pagination from "../../../common/classes/Pagination";
import FileTypeName from "../../../common/enums/FileTypeName";
import Order from "../../../common/enums/Order";
import Fetch from "../../classes/Fetch";

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

  public toString() {
    return this.getPrimaryID();
  }

  public getPrimaryID(): string {
    return this.id;
  }

  public static async getMany(search: ExtensionEntitySearchParameter = {}, pagination: Pagination<FileExtensionEntity> = new Pagination<FileExtensionEntity>(0, 10, {name: Order.ASC})) {
    const result = await Fetch.get<FileExtensionEntity[]>(this.URL, {...search, ...pagination.toObject()});
    return this.instantiate(result.content);
  }

}

type ExtensionEntitySearchParameter = {
  name?: string
  type?: string
  subtype?: string

  exclude?: FileExtensionEntity | FileExtensionEntity[]
}
