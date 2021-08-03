import Axios, {Canceler} from "axios";
import Order from "../../../common/enums/Order";
import Privacy from "../../../common/enums/Privacy";
import SetOperation from "../../../common/enums/SetOperation";
import RequestData from "../../classes/RequestData";
import Helper from "../../Helper";
import FileExtensionEntity from "./FileExtensionEntity";
import FileTagEntity from "./FileTagEntity";
import UserEntity from "../UserEntity";
import FileTypeName from "../../../common/enums/FileTypeName";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";

export default class FileEntity extends BaseEntity {

  public id: string;
  public name: string;
  public size: number;
  public privacy: Privacy;
  public data_hash: string;
  public share_hash: string;
  public flag_public_tag: boolean;
  public file_tag_list: FileTagEntity[];
  public file_extension: FileExtensionEntity;
  public user: UserEntity;
  public time_created: Date;

  public static URL = "file";

  constructor(entity?: Initializer<FileEntity>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.name = entity?.name ?? "";
    this.data_hash = entity?.data_hash ?? "";
    this.size = entity?.size ?? 0;
    this.privacy = entity?.privacy ?? Privacy.PRIVATE;
    this.share_hash = entity?.share_hash ?? "";
    this.flag_public_tag = entity?.flag_public_tag ?? false;
    this.file_tag_list = FileTagEntity.instantiate(entity?.file_tag_list);
    this.file_extension = new FileExtensionEntity(entity?.file_extension);
    this.user = new UserEntity(entity?.user);
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return this.getPrimaryID();
  }

  public getPrimaryID(): string {
    return this.id;
  }

  public getDataPath() {
    return Helper.getAPIPath(FileEntity.URL, "data", this.data_hash);
  }

  public getFilePath() {
    return Helper.getAPIPath(FileEntity.URL, "file", this.id);
  }

  public getFileType() {
    return this.file_extension.type;
  }

  public static async getCount(search: FileEntitySearchParameters = {}) {
    const result = await Axios.get<APIRequest<number>>(Helper.getAPIPath(this.URL, `count?${new RequestData(search).toString()}`));
    return result.data.content;
  }

  public static async getMany(search: FileEntitySearchParameters = {}, pagination: RequestPagination<FileEntity> = {skip: 0, limit: 10, order: {name: Order.ASC}}) {
    const result = await Axios.get<APIRequest<FileEntity[]>>(Helper.getAPIPath(`${this.URL}?${new RequestData(search).paginate(pagination).toString()}`));
    return this.instantiate(result.data.content);
  }

  public static async getOne(id: string | FileEntity, share_hash?: string) {
    const result = await Axios.get<APIRequest<FileEntity>>(Helper.getAPIPath(this.URL, id.toString(), "?", new RequestData({share_hash}).toString()));
    return new this(result.data.content);
  }

  public static async getData(data_hash: string) {
    const result = await Axios.get<string>(Helper.getAPIPath(this.URL, "data", data_hash));
    return result.data;
  }

  public static async postOne(file: File, parameters: FileEntityCreateParameters, onUploadProgress?: (progress: ProgressEvent) => void, cancel?: (cancel: Canceler) => void) {
    const cancelToken = cancel ? new Axios.CancelToken(cancel) : undefined;
    const result = await Axios.post<APIRequest<FileEntity>>(Helper.getAPIPath(this.URL), new RequestData(parameters).appendFile(file).toFormData(), {onUploadProgress, cancelToken});
    return new this(result.data.content);
  }

  public static async postRequestDownload(id: string | FileEntity | (string | FileEntity)[]) {
    const result = await Axios.post<APIRequest<string>>(Helper.getAPIPath(this.URL, "request-download"), new RequestData({id}).toObject());
    return result.data.content;
  }

  public static async postConfirmDownload(token: string) {
    Helper.submitForm(`${FileEntity.URL}/confirm-download`, {token});
  }

  public static async putOne(id: string | FileEntity, data: Properties<FileEntity>) {
    const result = await Axios.put<APIRequest<FileEntity>>(Helper.getAPIPath(this.URL, id.toString()), new RequestData(data).toObject());
    return new this(result.data.content);
  }

  public static async deleteOne(id: string | FileEntity) {
    const result = await Axios.delete<APIRequest<FileEntity>>(Helper.getAPIPath(this.URL, id.toString()));
    return new this(result.data.content);
  }

}

export type FileEntitySearchParameters = {
  name?: string
  file_type_list?: FileTypeName[]
  file_tag_list?: FileTagEntity[] | string[]
  file_tag_set_operation?: SetOperation
}

export type FileEntityCreateParameters = {
  file_tag_list?: FileTagEntity[] | string[]
}
