import _ from "lodash";

export default class Entity {

  public static domainAPI = process.browser ? `${location.protocol}//api.${location.hostname}` : "";
  public static domainFile = process.browser ? `${location.protocol}//files.${location.hostname}` : "";
  public static defaultID = "00000000-0000-0000-0000-000000000000";

  public static get URL(): string {
    throw new Error(`${this.constructor.name} should implement its own getURL method. This should never show up in production.`);
  }

  constructor(entity?: Properties<Entity>) {}

  public exists(): boolean {
    return this.getPrimaryKey() !== Entity.defaultID;
  }

  public toString(): string {
    throw new Error(`${this.constructor.name}.toString does not have an implementation. This should never show up in production.`);
  }

  public getPrimaryKey(): string {
    throw new Error(`${this.constructor.name}.getPrimaryKey does not have an implementation. This should never show up in production.`);
  }

  public static instantiate<E extends typeof Entity, I extends InstanceType<E>>(this: E, target: Initializer<I>[] = []): I[] {
    return _.map(target, o => new this(o as Properties<I>) as I);
  }

}
