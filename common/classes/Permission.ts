import _ from "lodash";
import PermissionLevel from "../enums/PermissionLevel";

export default class Permission {

  /* ----- ADMIN ----- */

  public get [PermissionLevel.ADMIN]() {
    return this[PermissionLevel.API_KEY] && this[PermissionLevel.FILE] && this[PermissionLevel.FILE_TAG] && this[PermissionLevel.USER];
  }

  public set [PermissionLevel.ADMIN](value: boolean) {
    this[PermissionLevel.API_KEY] = value;
    this[PermissionLevel.FILE] = value;
    this[PermissionLevel.FILE_TAG] = value;
    this[PermissionLevel.USER] = value;
  }

  /* ----- API KEY ----- */

  public [PermissionLevel.API_KEY_VIEW]: boolean = false;
  public [PermissionLevel.API_KEY_CREATE]: boolean = false;
  public [PermissionLevel.API_KEY_UPDATE]: boolean = false;
  public [PermissionLevel.API_KEY_DELETE]: boolean = false;

  public get [PermissionLevel.API_KEY]() {
    return this[PermissionLevel.API_KEY_VIEW] && this[PermissionLevel.API_KEY_CREATE] && this[PermissionLevel.API_KEY_UPDATE] && this[PermissionLevel.API_KEY_DELETE];
  }

  public set [PermissionLevel.API_KEY](value: boolean) {
    this[PermissionLevel.API_KEY_VIEW] = value;
    this[PermissionLevel.API_KEY_CREATE] = value;
    this[PermissionLevel.API_KEY_UPDATE] = value;
    this[PermissionLevel.API_KEY_DELETE] = value;
  }

  /* ----- FILE ----- */

  public [PermissionLevel.FILE_CREATE]: boolean = false;
  public [PermissionLevel.FILE_UPDATE]: boolean = false;
  public [PermissionLevel.FILE_DELETE]: boolean = false;

  public get [PermissionLevel.FILE]() {
    return this[PermissionLevel.FILE_CREATE] && this[PermissionLevel.FILE_UPDATE] && this[PermissionLevel.FILE_DELETE];
  }

  public set [PermissionLevel.FILE](value: boolean) {
    this[PermissionLevel.FILE_CREATE] = value;
    this[PermissionLevel.FILE_UPDATE] = value;
    this[PermissionLevel.FILE_DELETE] = value;
  }

  /* ----- FILE TAG ----- */

  public [PermissionLevel.FILE_TAG_CREATE]: boolean = false;
  public [PermissionLevel.FILE_TAG_DELETE]: boolean = false;

  public get [PermissionLevel.FILE_TAG]() {
    return this[PermissionLevel.FILE_TAG_CREATE] && this[PermissionLevel.FILE_TAG_DELETE];
  }

  public set [PermissionLevel.FILE_TAG](value: boolean) {
    this[PermissionLevel.FILE_TAG_CREATE] = value;
    this[PermissionLevel.FILE_TAG_DELETE] = value;
  }

  /* ----- USER ----- */

  public [PermissionLevel.USER_MASQUERADE]: boolean = false;
  public [PermissionLevel.USER_ELEVATED]: boolean = false;

  public get [PermissionLevel.USER]() {
    return this[PermissionLevel.USER_MASQUERADE] && this[PermissionLevel.USER_ELEVATED];
  }

  public set [PermissionLevel.USER](value: boolean) {
    this[PermissionLevel.USER_MASQUERADE] = value;
    this[PermissionLevel.USER_ELEVATED] = value;
  }

  constructor(initializer?: boolean | PermissionLevel[] | { [K in PermissionLevel]: boolean } | Permission) {
    Object.seal(this);

    if (typeof initializer === "boolean") {
      for (let key in this) _.set(this, key, initializer);
    }
    else if (initializer instanceof Permission) {
      for (let key in this) _.set(this, key, _.get(initializer, key, false));
    }
    else if (Array.isArray(initializer)) {
      for (let permission of initializer) _.set(this, permission, true);
    }
    else if (typeof initializer === "object") {
      Object.assign(this, initializer);
    }
  }

  public static getPermissionGroup(permission: PermissionLevel) {
    const split = permission.split(".");

    return split.length === 1 ? PermissionLevel.ADMIN : _.initial(split).join(".");
  }

  public toJSON(): PermissionLevel[] {
    if (this[PermissionLevel.ADMIN]) return [PermissionLevel.ADMIN];

    /* ----- API KEY ----- */

    const permission_list = [];
    if (this[PermissionLevel.API_KEY]) {
      permission_list.push(PermissionLevel.API_KEY);
    }
    else {
      if (this[PermissionLevel.API_KEY_VIEW]) permission_list.push(PermissionLevel.API_KEY_VIEW);
      if (this[PermissionLevel.API_KEY_CREATE]) permission_list.push(PermissionLevel.API_KEY_CREATE);
      if (this[PermissionLevel.API_KEY_UPDATE]) permission_list.push(PermissionLevel.API_KEY_UPDATE);
      if (this[PermissionLevel.API_KEY_DELETE]) permission_list.push(PermissionLevel.API_KEY_DELETE);
    }

    /* ----- FILE ----- */

    if (this[PermissionLevel.FILE]) {
      permission_list.push(PermissionLevel.FILE);
    }
    else {
      if (this[PermissionLevel.FILE_CREATE]) permission_list.push(PermissionLevel.FILE_CREATE);
      if (this[PermissionLevel.FILE_UPDATE]) permission_list.push(PermissionLevel.FILE_UPDATE);
      if (this[PermissionLevel.FILE_DELETE]) permission_list.push(PermissionLevel.FILE_DELETE);
    }

    /* ----- FILE TAG ----- */

    if (this[PermissionLevel.FILE_TAG]) {
      permission_list.push(PermissionLevel.FILE_TAG);
    }
    else {
      if (this[PermissionLevel.FILE_TAG_CREATE]) permission_list.push(PermissionLevel.FILE_TAG_CREATE);
      if (this[PermissionLevel.FILE_TAG_DELETE]) permission_list.push(PermissionLevel.FILE_TAG_DELETE);
    }

    /* ----- USER ----- */

    if (this[PermissionLevel.USER]) {
      permission_list.push(PermissionLevel.USER);
    }
    else {
      if (this[PermissionLevel.USER_ELEVATED]) permission_list.push(PermissionLevel.USER_ELEVATED);
      if (this[PermissionLevel.USER_MASQUERADE]) permission_list.push(PermissionLevel.USER_MASQUERADE);
    }

    return permission_list;
  }

}
