import {customAlphabet} from "nanoid";

export default class BaseEntity {

  public static database: any;
  public static defaultID = "00000000-0000-0000-0000-000000000000";

  public static generateDataHash = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_~()!@", 64);
  public static generateShareHash = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_", 32);

  public static regexDataHash = new RegExp("^[a-zA-Z0-9-._~()'!@,;]{64}$");
  public static regexShareHash = new RegExp("^[a-zA-Z0-9-_]{32}$");
  public static regexUUID = new RegExp("^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$", "i");

  public constructor(entity?: Properties<BaseEntity>) {}

  public equals(entity?: BaseEntity): boolean {
    return this.getPrimaryID() === entity?.getPrimaryID();
  }

  public exists(): boolean {
    return this.getPrimaryID() !== BaseEntity.defaultID;
  }

  public getPrimaryID(): string {
    throw new Error(`getPrimaryID method is not implemented for ${this.constructor.name}.`);
  }

  public toJSON(...args: any[]): object {
    throw new Error(`toJSON method is not implemented for ${this.constructor.name}.`);
  }

  public static instantiate<E extends typeof BaseEntity, I extends InstanceType<E>>(this: E, target: Initializer<I>[] = []): I[] {
    return target.map(o => (o instanceof this ? o : new this(o as Properties<I>)) as I);
  }
}
