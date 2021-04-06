import _ from "lodash";
import PermissionLevel from "../enums/PermissionLevel";
import ServerException from "../exceptions/ServerException";

export default class Permission {

  public user: {
    elevated: boolean
    masquerade: boolean
  };

  public api_key: {
    view: boolean
    create: boolean
    update: boolean
    delete: boolean
  };

  public file: {
    create: boolean
    update: boolean
    delete: boolean
  };

  public file_tag: {
    create: boolean
  };

  constructor(permission: PermissionJSON = {}) {
    if (!permission) permission = {};

    this.user = {
      elevated:   permission === true || permission.user === true || !!permission.user?.elevated,
      masquerade: permission === true || permission.user === true || !!permission.user?.masquerade,
    };

    this.api_key = {
      view:   permission === true || permission.api_key === true || !!permission.api_key?.view,
      create: permission === true || permission.api_key === true || !!permission.api_key?.create,
      update: permission === true || permission.api_key === true || !!permission.api_key?.update,
      delete: permission === true || permission.api_key === true || !!permission.api_key?.delete,
    };

    this.file = {
      create: permission === true || permission.file === true || !!permission.file?.create,
      update: permission === true || permission.file === true || !!permission.file?.update,
      delete: permission === true || permission.file === true || !!permission.file?.delete,
    };

    this.file_tag = {
      create: permission === true || permission.file_tag === true || !!permission.file_tag?.create,
    };
  }

  public hasPermission(permission: PermissionLevel) {
    return _.get(this, permission, false);
  }

  public toJSON() {
    if (_.every(PermissionLevel, permission => _.get(this, permission))) return true;
    const {user, api_key, file, file_tag} = this;
    const object = {
      user:     _.every(user) ? true : _.pickBy(user),
      api_key:  _.every(api_key) ? true : _.pickBy(api_key),
      file:     _.every(file) ? true : _.pickBy(file),
      file_tag: _.every(file_tag) ? true : _.pickBy(file_tag),
    }

    return _.every(object, value => typeof value !== "boolean" && !_.size(value)) ? {} : object;
  }

}

export type PermissionJSON = PermissionObject<Properties<Permission>>
type PermissionObject<T> = T extends object ? true | { [K in keyof T]?: PermissionObject<T[K]> } : T;


