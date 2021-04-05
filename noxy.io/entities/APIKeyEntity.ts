import Axios from "axios";
import _ from "lodash";
import Entity from "../classes/Entity";
import PermissionData from "../classes/PermissionData";
import RequestData from "../classes/RequestData";
import Order from "../enums/Order";
import UserEntity from "./UserEntity";
import PermissionLevel from "../enums/PermissionLevel";

export default class APIKeyEntity extends Entity {

  public id: string;
  public token: string;
  public permission: PermissionData;
  public limit_per_decasecond: number;
  public limit_per_minute: number;
  public user?: UserEntity;
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/api-key`;

  constructor(entity?: Properties<APIKeyEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.token = entity?.token ?? "";
    this.permission = new PermissionData(entity?.permission);
    this.limit_per_decasecond = entity?.limit_per_decasecond ?? 0;
    this.limit_per_minute = entity?.limit_per_minute ?? 0;
    this.user = new UserEntity(entity?.user);
    this.time_created = entity?.time_created ?? new Date();
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public hasPermission(permission: PermissionLevel) {
    return this.permission.hasPermission(permission);
  }

  public isAdmin() {
    return this.permission.isAdmin();
  };

  public static async get(search: APIKeyEntitySearchParameters = {}, pagination: RequestPagination<APIKeyEntity> = {skip: 0, limit: 10, order: {time_created: Order.DESC}}) {
    const result = await Axios.get<APIRequest<APIKeyEntity[]>>(`${this.URL}?${new RequestData(search).paginate(pagination)}`);
    return this.instantiate(result.data.content);
  }

  public static async getByID(id: string) {
    const result = await Axios.get<APIRequest<APIKeyEntity>>(`${this.URL}/${id}`);
    return new this(result.data.content);
  }

  public static async count(search: APIKeyEntitySearchParameters = {}) {
    const result = await Axios.get<APIRequest<number>>(`${this.URL}/count?${new RequestData(search)}`);
    return result.data.content;
  }

  public static async create(parameters: APIKeyEntityCreateParameters) {
    const result = await Axios.post<APIRequest<APIKeyEntity>>(this.URL, new RequestData(parameters).toObject());
    return new this(result.data.content);
  }

  public static async update(id: string, parameters: APIKeyEntityUpdateParameters) {
    const result = await Axios.put<APIRequest<APIKeyEntity>>(`${this.URL}/${id}`, new RequestData(parameters).toObject());
    return new this(result.data.content);
  }

  public static async delete(id: string) {
    const result = await Axios.delete<APIRequest<APIKeyEntity>>(`${this.URL}/${id}`);
    return new this(result.data.content);
  }

}

export type APIKeyEntitySearchParameters = {
  exclude?: APIKeyEntity[]
}

export type APIKeyEntityCreateParameters = {
  user: UserEntity
  permission: PermissionData
  limit_per_decasecond: number
  limit_per_minute: number
}

export type APIKeyEntityUpdateParameters = {
  permission: PermissionData
  limit_per_decasecond: number
  limit_per_minute: number
}
