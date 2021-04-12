import Axios, {Canceler} from "axios";
import Order from "../../common/enums/Order";
import SetOperation from "../../common/enums/SetOperation";
import Entity from "../classes/Entity";
import RequestData from "../classes/RequestData";
import FileExtensionEntity from "./FileExtensionEntity";
import FileTagEntity from "./FileTagEntity";
import FileTypeEntity from "./FileTypeEntity";
import UserEntity from "./UserEntity";

export default class FileEntity extends Entity {

  public id: string;
  public name: string;
  public alias: string;
  public size: number;
  public file_extension: FileExtensionEntity;
  public user_created: UserEntity;
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/file`;

  constructor(entity?: Properties<FileEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.name = entity?.name ?? "";
    this.alias = entity?.alias ?? "";
    this.size = entity?.size ?? 0;
    this.file_extension = new FileExtensionEntity(entity?.file_extension);
    this.user_created = new UserEntity(entity?.user_created);
    this.time_created = entity?.time_created ?? new Date();
  }

  public toString() {
    return this.name;
  }

  public getPrimaryKey() {
    return this.id;
  }

  public getPath() {
    return `${FileEntity.URL}/data/${this.alias}`;
  }

  public static async count(search: FileEntitySearchParameters = {}) {
    const result = await Axios.get<APIRequest<number>>(`${this.URL}/count?${new RequestData(search)}`);
    return result.data.content;
  }

  public static async findMany(search: FileEntitySearchParameters = {}, pagination: RequestPagination<FileEntity> = {skip: 0, limit: 10, order: {name: Order.ASC}}) {
    const result = await Axios.get<APIRequest<FileEntity[]>>(`${this.URL}?${new RequestData(search).paginate(pagination)}`);
    return this.instantiate(result.data.content);
  }

  public static async getByID(id: string | FileEntity) {
    id = typeof id === "string" ? id : id.getPrimaryKey();
    const result = await Axios.get<APIRequest<FileEntity>>(`${this.URL}/${id}`);
    return new this(result.data.content);
  }

  public static async create(file: File, parameters: FileEntityCreateParameters, onUploadProgress?: (progress: ProgressEvent) => void, cancel?: (cancel: Canceler) => void) {
    const cancelToken = cancel ? new Axios.CancelToken(cancel) : undefined;
    const result = await Axios.post<APIRequest<FileEntity>>(this.URL, new RequestData(parameters).appendFile(file).toFormData(), {onUploadProgress, cancelToken});
    return new this(result.data.content);
  }

  public static async download(id: (string | FileEntity)[]) {
    await Axios.get<APIRequest<FileEntity>>(`${this.URL}/download?${new RequestData({id})}`);
  }

  public static async removeByID(id: string | FileEntity) {
    id = typeof id === "string" ? id : id.getPrimaryKey();
    const result = await Axios.put<APIRequest<FileEntity>>(`${this.URL}/${id}`, {file_tag_list: []});
    return new this(result.data.content);
  }

}

export type FileEntitySearchParameters = {
  name?: string
  file_type_list?: FileTypeEntity[] | string[]
  file_tag_list?: FileTagEntity[] | string[]
  file_tag_set_operation?: SetOperation
}

export type FileEntityCreateParameters = {
  file_tag_list?: FileTagEntity[] | string[]
}
