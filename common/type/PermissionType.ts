import {Type, Platform, EntityProperty} from "@mikro-orm/core";
import Permission from "../classes/Permission";

export default class PermissionType extends Type<Permission, string> {

  public convertToDatabaseValue(value: Permission, platform: Platform): string {
    return value.toJSON();
  }

  public convertToJSValue(value: string, platform: Platform): Permission {
    return new Permission(value);
  }

  public getColumnType(prop: EntityProperty, platform: Platform) {
    return "json";
  }

};
