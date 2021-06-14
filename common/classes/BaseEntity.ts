import {Entity as DBEntity} from "@mikro-orm/core/decorators/Entity";
import {customAlphabet} from "nanoid";
import _ from "lodash";
import Database from "../services/Database";
import {Collection} from "@mikro-orm/core";
import ServerException from "../exceptions/ServerException";

@DBEntity({abstract: true})
export default class BaseEntity {

  public static defaultID = "00000000-0000-0000-0000-000000000000";

  public static generateDataHash = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-._~()'!@,;", 64);
  public static generateShareHash = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_", 32);

  public static regexDataHash = new RegExp("^[a-zA-Z0-9-._~()'!@,;]{64}$");
  public static regexShareHash = new RegExp("^[a-zA-Z0-9-_]{32}$");

  public getPrimaryID() {
    return _.join(_.values(_.pick(this, Database.instance.getMetadata().get(this.constructor.name).primaryKeys)), ";");
  }

  public getPrimaryKey() {
    return _.pick(this, Database.instance.getMetadata().get(this.constructor.name).primaryKeys);
  }

  public toJSON(parent: string = "content", simplify: string[] = []): {[key: string]: any} {
    const type = Database.instance.getMetadata().get(this.constructor.name);

    return _.reduce(this, (result, value, key) => {
      const property = type.properties[key];
      if (property.hidden) return result;

      if (property.reference === "1:m") {
        return {...result, [key]: this.toJSONList(key as keyof this, [property.mappedBy])};
      }

      if (property.reference === "m:1") {
        const entity = value as unknown as BaseEntity;
        return {...result, [key]: simplify.includes(property.name) ? entity.getPrimaryKey() : entity.toJSON(this.constructor.name, [property.inversedBy])};
      }

      return {...result, [key]: value};
    }, {} as {[key: string]: any});
  }

  public toJSONList(field: keyof this, simplify: string[]) {
    if (!(this[field] instanceof Collection)) throw new ServerException(500);

    const collection: Collection<BaseEntity> = this[field] as any;
    if (!collection.isInitialized()) return [];

    return _.map(collection.getItems(), entity => entity.toJSON(this.constructor.name, simplify));
  }
}
