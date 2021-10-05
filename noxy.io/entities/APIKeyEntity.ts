import _ from "lodash";
import BaseEntity from "../../common/classes/Entity/BaseEntity";
import Pagination from "../../common/classes/Pagination";
import Permission from "../../common/classes/Permission";
import Order from "../../common/enums/Order";
import PermissionLevel from "../../common/enums/PermissionLevel";
import Fetch from "../classes/Fetch";
import UserEntity from "./UserEntity";

export default class APIKeyEntity extends BaseEntity {
  
  public id: string;
  public token: string;
  public permission: Permission;
  public limit_per_decasecond: number;
  public limit_per_minute: number;
  public user: UserEntity;
  public time_created: Date;
  
  public static URL = "api-key";
  
  constructor(entity?: Initializer<APIKeyEntity>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.token = entity?.token ?? "";
    this.permission = new Permission(entity?.permission);
    this.limit_per_decasecond = entity?.limit_per_decasecond ?? 0;
    this.limit_per_minute = entity?.limit_per_minute ?? 0;
    this.user = new UserEntity(entity?.user);
    this.time_created = new Date(entity?.time_created ?? 0);
  }
  
  public toString() {
    return this.getPrimaryID();
  }
  
  public getPrimaryID(): string {
    return this.id;
  }
  
  public isAdmin() {
    return this.permission[PermissionLevel.ADMIN];
  }
  
  public hasAnyPermission(...permission_list: PermissionLevel[]) {
    return _.some(permission_list, permission => this.permission[permission]);
  }
  
  public hasPermission(...permission_list: PermissionLevel[]) {
    return _.every(permission_list, permission => this.permission[permission]);
  }
  
  public static async count(search: APIKeyEntitySearchParameters = {}) {
    return Fetch.get<number>(`${this.URL}/count`, search);
  }
  
  public static async get(search: APIKeyEntitySearchParameters = {}, pagination:  Pagination<APIKeyEntity> = new Pagination<APIKeyEntity>(0, 10, {time_created: Order.DESC})) {
    const result = await Fetch.get<APIKeyEntity[]>(this.URL, {...search, ...pagination});
    return this.instantiate(result.content);
  }
  
  public static async getByID(id: string | APIKeyEntity) {
    const result = await Fetch.get<APIKeyEntity>(`${this.URL}/${id}`);
    return new this(result.content);
  }
  
  public static async create(parameters: APIKeyEntityCreateParameters) {
    const result = await Fetch.post<APIKeyEntity>(this.URL, parameters);
    return new this(result.content);
  }
  
  public static async update(id: string | APIKeyEntity, parameters: APIKeyEntityUpdateParameters) {
    const result = await Fetch.put<APIKeyEntity>(`${this.URL}/${id}`, parameters);
    return new this(result.content);
  }
  
  public static async delete(id: string | APIKeyEntity) {
    const result = await Fetch.delete<APIKeyEntity>(`${this.URL}/${id}`);
    return new this(result.content);
  }
  
}

export type APIKeyEntitySearchParameters = {
  exclude?: APIKeyEntity[]
}

export type APIKeyEntityCreateParameters = {
  user: UserEntity
  permission: Permission
  limit_per_decasecond: number
  limit_per_minute: number
}

export type APIKeyEntityUpdateParameters = {
  permission: Permission
  limit_per_decasecond: number
  limit_per_minute: number
}
