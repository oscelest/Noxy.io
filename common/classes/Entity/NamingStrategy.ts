import {NamingStrategy as INamingStrategy} from "@mikro-orm/core";
import _ from "lodash";

export default class NamingStrategy implements INamingStrategy {

  public classToMigrationName(timestamp: string): string {
    return `migration_${timestamp}`;
  }

  public classToTableName(entityName: string): string {
    return _.snakeCase(entityName);
  }

  public getClassName(file: string): string {
    return _.snakeCase(file);
  }

  public joinColumnName(propertyName: string): string {
    return `join/${propertyName}`;
  }

  public joinKeyColumnName(entityName: string, referencedColumnName?: string): string {
    return referencedColumnName ? `${_.snakeCase(entityName)}_${referencedColumnName}` : `${_.snakeCase(entityName)}`;
  }

  public joinTableName(sourceEntity: string, targetEntity: string): string {
    return `jct/${_.snakeCase(sourceEntity)}-${_.snakeCase(targetEntity)}`;
  }

  public propertyToColumnName(propertyName: string): string {
    return propertyName;
  }

  public referenceColumnName(): string {
    return "reference";
  }

  public aliasName(entityName: string, index: number): string {
    return entityName;
  }

  public columnNameToProperty(columnName: string): string {
    return columnName;
  }

  public indexName(tableName: string, columns: string[], type: "primary" | "foreign" | "unique" | "index" | "sequence" | "check"): string {
    return `${type}_${tableName}_${columns.join("+")}`;
  }

}
