import Axios from "axios";
import _ from "lodash";
import Permission from "../../common/classes/Permission";
import Order from "../../common/enums/Order";
import PermissionLevel from "../../common/enums/PermissionLevel";
import RequestData from "../classes/RequestData";
import UserEntity from "./UserEntity";
import Helper from "../Helper";
import BaseEntity from "../../common/classes/Entity/BaseEntity";

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
    const result = await Axios.get<APIRequest<number>>(Helper.getAPIPath(this.URL, `count?${new RequestData(search).toString()}`));
    return result.data.content;
  }

  public static async get(search: APIKeyEntitySearchParameters = {}, pagination: RequestPagination<APIKeyEntity> = {skip: 0, limit: 10, order: {time_created: Order.DESC}}) {
    const result = await Axios.get<APIRequest<APIKeyEntity[]>>(Helper.getAPIPath(`${this.URL}?${new RequestData(search).paginate(pagination).toString()}`));
    return this.instantiate(result.data.content);
  }

  public static async getByID(id: string | APIKeyEntity) {
    const result = await Axios.get<APIRequest<APIKeyEntity>>(Helper.getAPIPath(this.URL, id.toString()));
    return new this(result.data.content);
  }

  public static async create(parameters: APIKeyEntityCreateParameters) {
    const result = await Axios.post<APIRequest<APIKeyEntity>>(Helper.getAPIPath(this.URL), new RequestData(parameters).toObject());
    return new this(result.data.content);
  }

  public static async update(id: string | APIKeyEntity, parameters: APIKeyEntityUpdateParameters) {
    const result = await Axios.put<APIRequest<APIKeyEntity>>(Helper.getAPIPath(this.URL, id.toString()), new RequestData(parameters).toObject());
    return new this(result.data.content);
  }

  public static async delete(id: string | APIKeyEntity) {
    const result = await Axios.delete<APIRequest<APIKeyEntity>>(Helper.getAPIPath(this.URL, id.toString()));
    return new this(result.data.content);
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
