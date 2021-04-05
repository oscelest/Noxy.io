import Axios from "axios";
import _ from "lodash";
import Entity from "../classes/Entity";
import RequestData from "../classes/RequestData";
import Order from "../enums/Order";
import PermissionLevel from "../enums/PermissionLevel";
import RequestHeader from "../enums/RequestHeader";
import APIKeyEntity from "./APIKeyEntity";

export default class UserEntity extends Entity {

  public id: string;
  public email: string;
  public username: string;
  public api_key_list: APIKeyEntity[];
  public time_created: Date;
  public time_login?: Date;

  public static URL = `${Entity.domainAPI}/user`;

  constructor(entity?: Properties<UserEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.email = entity?.email ?? "";
    this.username = entity?.username ?? "";
    this.api_key_list = APIKeyEntity.instantiate(entity?.api_key_list);
    this.time_created = entity?.time_created ?? new Date();
    this.time_login = entity?.time_login;
  }

  public toString() {
    return this.email;
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public getCurrentAPIKey() {
    return _.find(this.api_key_list, key => key.token === localStorage[RequestHeader.AUTHORIZATION]) ?? _.first(this.api_key_list) ?? new APIKeyEntity();
  }

  public hasPermission(permission: PermissionLevel) {
    return this.getCurrentAPIKey().hasPermission(permission);
  }

  public static async get(search: UserEntityGetParameters = {}, pagination: RequestPagination<UserEntity> = {skip: 0, limit: 10, order: {email: Order.ASC}}) {
    const {data: {content}} = await Axios.get<APIRequest<UserEntity[]>>(`${this.URL}?${new RequestData(search).paginate(pagination)}`);
    return this.instantiate(content);
  }

  public static async create(params: UserEntityCreateParameters) {
    const {data: {content}} = await Axios.post<APIRequest<UserEntity>>(`${UserEntity.URL}`, new RequestData(params).toObject());
    return new this(content);
  }

  public static async logIn(params?: UserEntityLogInParameters) {
    const {data: {content}} = await Axios.post<APIRequest<UserEntity>>(`${UserEntity.URL}/login`, new RequestData(params).toObject());
    return new this(content);
  }

  public static async requestPasswordReset(email: string) {
    const {data: {content}} = await Axios.post<APIRequest<UserEntity>>(`${UserEntity.URL}/request-reset`, new RequestData({email}).toObject());
    return new this(content);
  }

  public static async confirmPasswordReset(token: string, password: string) {
    const {data: {content}} = await Axios.post<APIRequest<UserEntity>>(`${UserEntity.URL}/confirm-reset`, new RequestData({token, password}).toObject());
    return new this(content);
  }

  public static async put(id: string, params: UserEntityPutParameters) {
    const {data: {content}} = await Axios.put<APIRequest<UserEntity>>(`${this.URL}/${id}`, new RequestData(params).toObject());
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
