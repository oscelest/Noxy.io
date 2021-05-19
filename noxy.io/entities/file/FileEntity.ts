import Axios, {Canceler} from "axios";
import Order from "../../../common/enums/Order";
import Privacy from "../../../common/enums/Privacy";
import SetOperation from "../../../common/enums/SetOperation";
import Entity from "../../classes/Entity";
import RequestData from "../../classes/RequestData";
import Helper from "../../Helper";
import FileExtensionEntity from "./FileExtensionEntity";
import FileTagEntity from "./FileTagEntity";
import FileTypeEntity from "./FileTypeEntity";
import UserEntity from "../UserEntity";

export default class FileEntity extends Entity {

  public id: string;
  public name: string;
  public size: number;
  public privacy: Privacy;
  public data_hash: string;
  public share_hash: string;
  public flag_public_tag: boolean;
  public file_tag_list: FileTagEntity[];
  public file_extension: FileExtensionEntity;
  public user_created: UserEntity;
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/file`;

  constructor(entity?: EntityInitializer<FileEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.name = entity?.name ?? "";
    this.data_hash = entity?.data_hash ?? "";
    this.size = entity?.size ?? 0;
    this.privacy = entity?.privacy ?? Privacy.PRIVATE;
    this.share_hash = entity?.share_hash ?? "";
    this.flag_public_tag = entity?.flag_public_tag ?? false;
    this.file_tag_list = FileTagEntity.instantiate(entity?.file_tag_list);
    this.file_extension = new FileExtensionEntity(entity?.file_extension);
    this.user_created = new UserEntity(entity?.user_created);
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return this.name;
  }

  public getPrimaryKey() {
    return this.id;
  }

  public getDataPath() {
    return `${FileEntity.URL}/data/${this.data_hash}`;
  }

  public getFilePath() {
    return `${FileEntity.URL}/file/${this.id}`;
  }

  public getFileType() {
    return this.file_extension.file_type.name;
  }

  public static async count(search: FileEntitySearchParameters = {}) {
    const result = await Axios.get<APIRequest<number>>(`${this.URL}/count?${new RequestData(search)}`);
    return result.data.content;
  }

  public static async findMany(search: FileEntitySearchParameters = {}, pagination: RequestPagination<FileEntity> = {skip: 0, limit: 10, order: {name: Order.ASC}}) {
    const result = await Axios.get<APIRequest<FileEntity[]>>(`${this.URL}?${new RequestData(search).paginate(pagination)}`);
    return this.instantiate(result.data.content);
  }

  public static async getByID(id: string | FileEntity, share_hash?: string) {
    id = typeof id === "string" ? id : id.getPrimaryKey();
    const result = await Axios.get<APIRequest<FileEntity>>(`${this.URL}/${id}?${new RequestData({share_hash})}`);
    return new this(result.data.content);
  }

  public static async getByDataHash(data_hash: string) {
    const result = await Axios.get<string>(`${this.URL}/data/${data_hash}`);
    return result.data;
  }

  public static async create(file: File, parameters: FileEntityCreateParameters, onUploadProgress?: (progress: ProgressEvent) => void, cancel?: (cancel: Canceler) => void) {
    const cancelToken = cancel ? new Axios.CancelToken(cancel) : undefined;
    const result = await Axios.post<APIRequest<FileEntity>>(this.URL, new RequestData(parameters).appendFile(file).toFormData(), {onUploadProgress, cancelToken});
    return new this(result.data.content);
  }

  public static async requestDownload(id: string | FileEntity | (string | FileEntity)[]) {
    const result = await Axios.post<APIRequest<string>>(`${this.URL}/request-download`, new RequestData({id}).toObject());
    return result.data.content;
  }

  public static async confirmDownload(token: string) {
    Helper.submitForm(`${FileEntity.URL}/confirm-download`, {token});
  }

  public static async updateOne(id: string | FileEntity, data: Properties<FileEntity>) {
    id = typeof id === "string" ? id : id.getPrimaryKey();
    const result = await Axios.put<APIRequest<FileEntity>>(`${this.URL}/${id}`, new RequestData(data).toObject());
    return new this(result.data.content);
  }

  public static async deleteOne(id_or_alias: string | FileEntity) {
    id_or_alias = typeof id_or_alias === "string" ? id_or_alias : id_or_alias.getPrimaryKey();
    const result = await Axios.delete<APIRequest<FileEntity>>(`${this.URL}/${id_or_alias}`);
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
