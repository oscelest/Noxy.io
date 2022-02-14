import {Type} from "@mikro-orm/core";
import Permission from "../classes/Permission";

export default class PermissionType extends Type<Permission, string> {

  public convertToDatabaseValue(value: Permission): string {
    return value.toJSON();
  }

  public convertToJSValue(value: string): Permission {
    return new Permission(value);
  }

  public getColumnType() {
    return "json";
  }

};
