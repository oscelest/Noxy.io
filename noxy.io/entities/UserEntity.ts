import _ from "lodash";
import BaseEntity from "../../common/classes/Entity/BaseEntity";
import Pagination from "../../common/classes/Pagination";
import Order from "../../common/enums/Order";
import PermissionLevel from "../../common/enums/PermissionLevel";
import RequestHeader from "../../common/enums/RequestHeader";
import Fetch from "../classes/Fetch";
import APIKeyEntity from "./APIKeyEntity";

export default class UserEntity extends BaseEntity {
  
  public id: string;
  public email: string;
  public username: string;
  public api_key_list: APIKeyEntity[];
  public time_created: Date;
  public time_login?: Date;
  
  public static URL = "user";
  
  constructor(entity?: Initializer<UserEntity>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.email = entity?.email ?? "";
    this.username = entity?.username ?? "";
    this.api_key_list = APIKeyEntity.instantiate(entity?.api_key_list);
    this.time_created = new Date(entity?.time_created ?? 0);
    this.time_login = new Date(entity?.time_login ?? 0);
  }
  
  public toString() {
    return this.getPrimaryID();
  }
  
  public getPrimaryID(): string {
    return this.id;
  }
  
  public getCurrentAPIKey() {
    return _.find(this.api_key_list, key => key.token === localStorage[RequestHeader.AUTHORIZATION]) ?? _.first(this.api_key_list) ?? new APIKeyEntity();
  }
  
  public isAdmin() {
    return this.getCurrentAPIKey().isAdmin();
  }
  
  public hasAnyPermission(...permission_list: PermissionLevel[]) {
    return this.getCurrentAPIKey().hasAnyPermission(...permission_list);
  }
  
  public hasPermission(...permission_list: PermissionLevel[]) {
    return this.getCurrentAPIKey().hasPermission(...permission_list);
  }
  
  public static async getMany(search: UserEntityGetParameters = {}, pagination: Pagination<UserEntity> = new Pagination<UserEntity>(0, 10, {email: Order.ASC})) {
    const {content} = await Fetch.get<UserEntity[]>(this.URL, {...search, ...pagination});
    return this.instantiate(content);
  }
  
  public static async getOne(id: string | UserEntity) {
    const {content} = await Fetch.get<UserEntity>(`${this.URL}/${id}`);
    return new this(content);
  }
  
  public static async postOne(params: UserEntityCreateParameters) {
    const {content} = await Fetch.post<UserEntity>(this.URL, params);
    return new this(content);
  }
  
  public static async postLogIn(params?: UserEntityLogInParameters) {
    const {content} = await Fetch.post<UserEntity>(`${this.URL}/login`, params);
    return new this(content);
  }
  
  public static async postRequestPasswordReset(email: string) {
    const {content} = await Fetch.post<UserEntity>(`${this.URL}/request-reset`, {email});
    return new this(content);
  }
  
  public static async postConfirmPasswordReset(token: string, password: string) {
    const {content} = await Fetch.post<UserEntity>(`${this.URL}/confirm-reset`, {token, password});
    return new this(content);
  }
  
  public static async putOne(id: string | UserEntity, params: UserEntityPutParameters) {
    const {content} = await Fetch.put<UserEntity>(`${this.URL}/${id}`, params);
    return new this(content);
  }
  
}

type UserEntityGetParameters = {
  email?: string
  
  exclude?: UserEntity | UserEntity[]
}

type UserEntityCreateParameters = {
  email: string
  username: string
  password: string
}

type UserEntityLogInParameters = {
  email: string
  password: string
}

type UserEntityPutParameters = {
  email?: string
  username?: string
  password?: string
}
