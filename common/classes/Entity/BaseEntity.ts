import {Collection} from "@mikro-orm/core";
import _ from "lodash";
import {customAlphabet} from "nanoid";

export default class BaseEntity {

  public static database: any;
  public static defaultID = "00000000-0000-0000-0000-000000000000";

  public static generateDataHash = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_~()!@", 64);
  public static generateShareHash = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_", 32);

  public static regexDataHash = new RegExp("^[a-zA-Z0-9-._~()'!@,;]{64}$");
  public static regexShareHash = new RegExp("^[a-zA-Z0-9-_]{32}$");
  public static regexUUID = new RegExp("^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$", "i");

  constructor(entity?: Properties<BaseEntity>) {}

  public equals(entity?: BaseEntity): boolean {
    return this.getPrimaryID() === entity?.getPrimaryID();
  }

  public exists(): boolean {
    return this.getPrimaryID() !== BaseEntity.defaultID;
  }

  public getPrimaryID() {
    if (!(this.constructor as typeof BaseEntity).database) throw new Error("Cannot get primary ID of entity - No database instance found");
    return _.join(_.values(_.pick(this, (this.constructor as typeof BaseEntity).database.instance.getMetadata().get(this.constructor.name).primaryKeys)), ";");
  }

  public getPrimaryKey() {
    if (!(this.constructor as typeof BaseEntity).database) throw new Error("Cannot get primary key of entity - No database instance found");
    return _.pick(this, (this.constructor as typeof BaseEntity).database.instance.getMetadata().get(this.constructor.name).primaryKeys);
  }

  public toJSON(parent: string = "content", simplify: string[] = []): {[key: string]: any} {
    if (!(this.constructor as typeof BaseEntity).database) throw new Error("Cannot convert entity to JSON - No database instance found");
    const type = (this.constructor as typeof BaseEntity).database.instance.getMetadata().get(this.constructor.name);

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
    if (!(this.constructor as typeof BaseEntity).database) throw new Error("Cannot convert field to JSON collection - No database instance found");

    const collection: Collection<BaseEntity> = this[field] as any;
    return collection.isInitialized() ? _.map(collection.getItems(), entity => entity.toJSON(this.constructor.name, simplify)) : [];
  }

  public static instantiate<E extends typeof BaseEntity, I extends InstanceType<E>>(this: E, target: Initializer<I>[] = []): I[] {
    return _.map(target, o => new this(o as Properties<I>) as I);
  }
}
