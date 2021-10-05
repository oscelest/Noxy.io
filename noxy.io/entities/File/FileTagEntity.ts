import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import Pagination from "../../../common/classes/Pagination";
import Order from "../../../common/enums/Order";
import Fetch from "../../classes/Fetch";
import UserEntity from "../UserEntity";

export default class FileTagEntity extends BaseEntity {

  public id: string;
  public name: string;
  public user: UserEntity;
  public time_created: Date;

  public static URL = "file-tag";

  constructor(entity?: Initializer<FileTagEntity>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.name = entity?.name ?? "";
    this.user = new UserEntity(entity?.user);
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return this.getPrimaryID();
  }

  public getPrimaryID(): string {
    return this.id;
  }

  public static render(file_tag: FileTagEntity) {
    return file_tag.name;
  }

  public static async getCount(search: TagEntitySearchParameter = {}) {
    const result = await Fetch.get<number>(`${this.URL}/count`, search);
    return result.content;
  }

  public static async getMany(search: TagEntitySearchParameter = {}, pagination: Pagination<FileTagEntity> = new Pagination<FileTagEntity>(0, 10, {name: Order.ASC})) {
    const result = await Fetch.get<FileTagEntity[]>(this.URL, {...search, ...pagination});
    return this.instantiate(result.content);
  }

  public static async getOne(id: string | FileTagEntity) {
    const result = await Fetch.get<FileTagEntity>(`${this.URL}/${id}`);
    return new this(result.content);
  }

  public static async getOneByName(name: string) {
    const result = await Fetch.get<FileTagEntity>(`${this.URL}/by-name/${name}`);
    return new this(result.content);
  }

  public static async createOne(parameters: FileTagEntityCreateParameters, ...caches: FileTagEntity[][]) {
    let result: FileTagEntity | undefined = undefined;

    try {
      if (caches.length) {
        for (let cache of caches) {
          for (let tag of cache) {
            if (tag.name.toLowerCase() === parameters.name.toLowerCase()) {
              result = tag;
              break;
            }
          }
          if (result !== undefined) break;
        }
      }

      if (result === undefined) {
        const response = await Fetch.post<FileTagEntity>(this.URL, parameters);
        result = new this(response.content);
      }

      return result;
    }
    catch (error) {
      const exception = error as Error;
      // TODO: Fix this
      // if (exception.response?.status === 409) return await FileTagEntity.getOneByName(parameters.name);
      throw exception;
    }
  }

  public static async deleteOne(id: string | FileTagEntity) {
    const result = await Fetch.delete<FileTagEntity>(`${this.URL}/${id}`);
    return new this(result.content);
  }
}

type TagEntitySearchParameter = {
  name?: string
  exclude?: FileTagEntity[]
}

type FileTagEntityCreateParameters = {
  name: string
}
