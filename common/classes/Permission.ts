import PermissionLevel from "../enums/PermissionLevel";

export default class PermissionData {

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
      delete: permission === true || permission.file === true || !!permission.file?.delete,
    };

    this.file_tag = {
      create: permission === true || permission.file_tag === true || !!permission.file_tag?.create,
    };
  }

  public hasPermission(permission: PermissionLevel) {
    switch (permission) {
      case PermissionLevel.API_KEY:
        return this.hasAPIKeyPermission();
      case PermissionLevel.API_KEY_VIEW:
        return this.api_key.view;
      case PermissionLevel.API_KEY_CREATE:
        return this.api_key.create;
      case PermissionLevel.API_KEY_UPDATE:
        return this.api_key.update;
      case PermissionLevel.API_KEY_DELETE:
        return this.api_key.delete;

      case PermissionLevel.FILE:
        return this.hasFilePermission();
      case PermissionLevel.FILE_CREATE:
        return this.file.create;
      case PermissionLevel.FILE_DELETE:
        return this.file.delete;

      case PermissionLevel.FILE_TAG:
        return this.hasFileTagPermission();
      case PermissionLevel.FILE_TAG_CREATE:
        return this.file_tag.create;

      case PermissionLevel.USER:
        return this.hasUserPermission();
      case PermissionLevel.USER_ELEVATED:
        return this.user.elevated;
      case PermissionLevel.USER_MASQUERADE:
        return this.user.masquerade;
    }
  }

  public hasAPIKeyPermission() {
    return this.api_key.view && this.api_key.create && this.api_key.update && this.api_key.delete;
  }

  public hasFilePermission() {
    return this.file.create && this.file.delete;
  }

  public hasFileTagPermission() {
    return this.file_tag.create;
  }

  public hasUserPermission() {
    return this.user.elevated && this.user.masquerade;
  }

  public isAdmin() {
    return this.hasAPIKeyPermission() && this.hasFilePermission() && this.hasFileTagPermission() && this.hasUserPermission();
  }

  public toJSON() {
    if (this.isAdmin()) return true;

    return {
      ...this.toUserJSON(),
      ...this.toAPIKeyJSON(),
      ...this.toFileJSON(),
      ...this.toFileTagJSON(),
    };
  }

  private toUserJSON() {
    if (this.hasUserPermission()) return {user: true};

    const result = {} as PermissionObject<"user">;
    if (this.user.elevated) result.user = {...result.user ?? {}, elevated: true};
    if (this.user.masquerade) result.user = {...result.user ?? {}, masquerade: true};
    return result;
  }

  private toAPIKeyJSON() {
    if (this.hasAPIKeyPermission()) return {api_key: true};

    const result = {} as PermissionObject<"api_key">;
    if (this.api_key.view) result.api_key = {...result.api_key ?? {}, view: true};
    if (this.api_key.create) result.api_key = {...result.api_key ?? {}, create: true};
    if (this.api_key.update) result.api_key = {...result.api_key ?? {}, update: true};
    if (this.api_key.delete) result.api_key = {...result.api_key ?? {}, delete: true};
    return result;
  }

  private toFileJSON() {
    if (this.hasFilePermission()) return {file: true};

    const result = {} as PermissionObject<"file">
    if (this.file.create) result.file = {...result.file ?? {}, create: true};
    if (this.file.delete) result.file = {...result.file ?? {}, delete: true};
    return result;
  }

  private toFileTagJSON() {
    if (this.hasFileTagPermission()) return {file_tag: true};

    const result = {} as PermissionObject<"file_tag">;
    if (this.file_tag.create) result.file_tag = {...result.file_tag ?? {}, create: true};
    return result;
  }

}

type PermissionJSON = PermissionJSONValue<Properties<PermissionData>>
type PermissionObject<K extends keyof PermissionObjectValue<Properties<PermissionData>>> = Pick<PermissionObjectValue<Properties<PermissionData>>, K>

type PermissionJSONValue<T> = T extends object ? true | { [K in keyof T]?: PermissionObjectValue<T[K]> } : T;
type PermissionObjectValue<T> = T extends object ? { [K in keyof T]?: PermissionObjectValue<T[K]> } : T;
type Properties<O> = { [K in keyof Pick<O, { [K in keyof O]: O[K] extends Function ? never : K }[keyof O]>]: O[K] };


