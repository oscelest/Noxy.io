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
  public file_tag_list: FileTagEntity[];
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
    this.file_tag_list = FileTagEntity.instantiate(entity?.file_tag_list);
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

  public getDataPath() {
    return `${FileEntity.URL}/data/${this.alias}`;
  }

  public getFilePath() {
    return `${location.host}/file/${this.alias}`;
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

  public static async getByID(id: string | FileEntity) {
    id = typeof id === "string" ? id : id.getPrimaryKey();
    const result = await Axios.get<APIRequest<FileEntity>>(`${this.URL}/${id}`);
    return new this(result.data.content);
  }

  public static async getDataByID(id: string | FileEntity) {
    id = typeof id === "string" ? id : id.getPrimaryKey();
    const result = await Axios.get<string>(`${this.URL}/data/${id}`);
    return result.data;
  }

  public static async create(file: File, parameters: FileEntityCreateParameters, onUploadProgress?: (progress: ProgressEvent) => void, cancel?: (cancel: Canceler) => void) {
    const cancelToken = cancel ? new Axios.CancelToken(cancel) : undefined;
    const result = await Axios.post<APIRequest<FileEntity>>(this.URL, new RequestData(parameters).appendFile(file).toFormData(), {onUploadProgress, cancelToken});
    return new this(result.data.content);
  }

  public static async requestDownload(id: (string | FileEntity)[]) {
    const result = await Axios.post<APIRequest<string>>(`${this.URL}/request-download`, new RequestData({id}).toObject());
    return result.data.content;
  }

  public static async confirmDownload(token: string) {
    const form = document.createElement("form");
    form.setAttribute("action", `${FileEntity.URL}/confirm-download`);
    form.setAttribute("method", "post");
    form.setAttribute("target", "_blank");

    const input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", "token");
    input.setAttribute("value", token);
    form.append(input);

    document.getElementById("__next")?.append(form);
    form.submit();
    form.remove();
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
