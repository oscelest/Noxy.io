import {NamingStrategy as INamingStrategy} from "@mikro-orm/core";
import _ from "lodash";

export default class NamingStrategy implements INamingStrategy {

  public classToMigrationName(timestamp: string): string {
    return `migration-${timestamp}`;
  }

  public classToTableName(entityName: string): string {
    return _.snakeCase(entityName);
  }

  public getClassName(file: string, separator?: string): string {
    return _.snakeCase(file);
  }

  public joinColumnName(propertyName: string): string {
    return `join/${propertyName}`;
  }

  public joinKeyColumnName(entityName: string, referencedColumnName?: string, composite?: boolean): string {
    return referencedColumnName ? `${_.snakeCase(entityName)}_${referencedColumnName}` : `${_.snakeCase(entityName)}`;
  }

  public joinTableName(sourceEntity: string, targetEntity: string, propertyName: string): string {
    return `jct/${_.snakeCase(sourceEntity)}-${_.snakeCase(targetEntity)}`;
  }

  public propertyToColumnName(propertyName: string): string {
    return propertyName;
  }

  public referenceColumnName(): string {
    return "reference";
  }

}
