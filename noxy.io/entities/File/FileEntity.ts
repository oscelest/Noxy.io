import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import Pagination from "../../../common/classes/Pagination";
import ProgressHandler from "../../../common/classes/ProgressHandler";
import FileTypeName from "../../../common/enums/FileTypeName";
import Order from "../../../common/enums/Order";
import Privacy from "../../../common/enums/Privacy";
import SetOperation from "../../../common/enums/SetOperation";
import Fetch from "../../classes/Fetch";
import Helper from "../../Helper";
import UserEntity from "../UserEntity";
import FileExtensionEntity from "./FileExtensionEntity";
import FileTagEntity from "./FileTagEntity";

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
    const result = await Fetch.get<number>(`${this.URL}/count`, search);
    return result.content;
  }

  public static async getMany(search: FileEntitySearchParameters = {}, pagination: Pagination<FileEntity> = new Pagination<FileEntity>(0, 10, {name: Order.ASC})) {
    const result = await Fetch.get<FileEntity[]>(this.URL, {...search, ...pagination});
    return this.instantiate(result.content);
  }

  public static async getOne(id: string | FileEntity, share_hash?: string) {
    const result = await Fetch.get<FileEntity>(`${this.URL}/${id}`, {share_hash});
    return new this(result.content);
  }

  public static async getData(data_hash: string) {
    const result = await Fetch.get<string>(`${this.URL}/data`, {data_hash});
    return result.content;
  }

  public static async postOne(file: File, parameters: FileEntityCreateParameters, progress?: ProgressHandler) {
    const result = await Fetch.post<FileEntity>(this.URL, {...parameters, file}, progress);
    return new this(result.content);
  }

  public static async postRequestDownload(id: string | FileEntity | (string | FileEntity)[]) {
    const result = await Fetch.post<string>(`${this.URL}/request-download`, {id});
    return result.content;
  }

  public static async postConfirmDownload(token: string) {
    Helper.submitForm(`${this.URL}/confirm-download`, {token});
  }

  public static async putOne(id: string | FileEntity, data: Properties<FileEntity>) {
    const result = await Fetch.put<FileEntity>(`${this.URL}/${id}`, data);
    return new this(result.content);
  }

  public static async deleteOne(id: string | FileEntity) {
    const result = await Fetch.delete<FileEntity>(`${this.URL}/${id}`);
    return new this(result.content);
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
