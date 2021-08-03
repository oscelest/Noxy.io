import Axios from "axios";
import _ from "lodash";
import Order from "../../common/enums/Order";
import PermissionLevel from "../../common/enums/PermissionLevel";
import RequestHeader from "../../common/enums/RequestHeader";
import RequestData from "../classes/RequestData";
import APIKeyEntity from "./APIKeyEntity";
import BaseEntity from "../../common/classes/Entity/BaseEntity";
import Helper from "../Helper";

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

  public static async getMany(search: UserEntityGetParameters = {}, pagination: RequestPagination<UserEntity> = {skip: 0, limit: 10, order: {email: Order.ASC}}) {
    const result = await Axios.get<APIRequest<UserEntity[]>>(Helper.getAPIPath(`${this.URL}?${new RequestData(search).paginate(pagination).toString()}`));
    return this.instantiate(result.data.content);
  }

  public static async getOne(id: string | UserEntity) {
    const response = await Axios.get<APIRequest<UserEntity>>(Helper.getAPIPath(this.URL, id.toString()));
    return new this(response.data.content);
  }

  public static async postOne(params: UserEntityCreateParameters) {
    const {data: {content}} = await Axios.post<APIRequest<UserEntity>>(Helper.getAPIPath(this.URL), new RequestData(params).toObject());
    return new this(content);
  }

  public static async postLogIn(params?: UserEntityLogInParameters) {
    const {data: {content}} = await Axios.post<APIRequest<UserEntity>>(Helper.getAPIPath(this.URL, "login"), new RequestData(params).toObject());
    return new this(content);
  }

  public static async postRequestPasswordReset(email: string) {
    const {data: {content}} = await Axios.post<APIRequest<UserEntity>>(Helper.getAPIPath(this.URL, "request-reset"), new RequestData({email}).toObject());
    return new this(content);
  }

  public static async postConfirmPasswordReset(token: string, password: string) {
    const {data: {content}} = await Axios.post<APIRequest<UserEntity>>(Helper.getAPIPath(this.URL, "confirm-reset"), new RequestData({token, password}).toObject());
    return new this(content);
  }

  public static async putOne(id: string | UserEntity, params: UserEntityPutParameters) {
    const {data: {content}} = await Axios.put<APIRequest<UserEntity>>(Helper.getAPIPath(this.URL, id.toString()), new RequestData(params).toObject());
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
