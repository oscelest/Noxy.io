import {Constructor, EntityManager, FindOptions, MikroORM, RequestContext, EntityRepository, EntityMetadata, Collection} from "@mikro-orm/core";
import _ from "lodash";
import HTTPMethod from "../../enums/HTTPMethod";
import Order from "../../enums/Order";
import ValidatorType from "../../enums/ValidatorType";
import ServerException from "../../exceptions/ServerException";
import Server from "../../services/Server";
import Validator from "../../services/Validator";
import Alias from "../Alias";
import BaseEntity from "./BaseEntity";
import {AnyEntity, GetRepository} from "@mikro-orm/core/typings";
import Database from "../../services/Database";

export default function DatabaseEntity<E>() {

  class DatabaseEntity extends BaseEntity {

    constructor(initializer?: Initializer<E>) {
      super();
    }

    // ----------
    // Decorators
    // ----------


    public getPrimaryID() {
      if (!Database.instance) throw new Error("Cannot get primary ID of entity - No database instance found");
      const properties = Object.getOwnPropertyNames(this);
      return Database.instance.getMetadata().get(this.constructor.name).primaryKeys.reduce((result, key) => properties.includes(key) ? [...result, key] : result, [] as string[]).join(";");
    }

    public getPrimaryKey() {
      if (!(this.constructor as typeof BaseEntity).database) throw new Error("Cannot get primary key of entity - No database instance found");
      const properties = Object.getOwnPropertyNames(this);
      const primary_keys = Database.instance.getMetadata().get(this.constructor.name).primaryKeys;
      return primary_keys.reduce((result, key) => !properties.includes(key) ? {...result, [key]: this[key as keyof this]} : result, {} as { [K in keyof this]?: this[K] });
    }

    public toJSON(parent: string = "content", simplify: string[] = []): {[key: string]: any} {
      if (!Database.instance) throw new Error("Cannot convert entity to JSON - No database instance found");
      const type = Database.instance.getMetadata().get(this.constructor.name);

      return Object.entries(this).reduce(
        (result, [key, value]) => {
          const property = type.properties[key];
          if (property.hidden) return result;

          if (property.reference === "1:m") {
            return {...result, [key]: this.toJSONList(key as keyof this, [property.mappedBy])};
          }

          if (property.reference === "m:1") {
            const entity = value as DatabaseEntity;
            return {...result, [key]: simplify.includes(property.name) ? entity.getPrimaryKey() : entity.toJSON(this.constructor.name, [property.inversedBy])};
          }

          return {...result, [key]: value};
        },
        {} as {[key: string]: any},
      );
    }

    public toJSONList(field: keyof this, simplify: string[]): {[key: string]: any}[] {
      if (!Database.instance) throw new Error("Cannot convert field to JSON collection - No database instance found");

      const collection: Collection<DatabaseEntity> = this[field] as any;
      return collection.isInitialized() ? collection.getItems().map(entity => entity.toJSON(this.constructor.name, simplify)) : [];
    }

    public static [HTTPMethod.GET](path: string, options?: Server.EndpointOptions) {
      return this.bindRoute(HTTPMethod.GET, path, options);
    }

    public static [HTTPMethod.POST](path: string, options?: Server.EndpointOptions) {
      return this.bindRoute(HTTPMethod.POST, path, options);
    }

    public static [HTTPMethod.PUT](path: string, options?: Server.EndpointOptions) {
      return this.bindRoute(HTTPMethod.PUT, path, options);
    }

    public static [HTTPMethod.DELETE](path: string, options?: Server.EndpointOptions) {
      return this.bindRoute(HTTPMethod.DELETE, path, options);
    }

    private static bindRoute(http_method: HTTPMethod, path: string, options: Server.EndpointOptions = {}) {
      return function (constructor: DecoratorConstructor, method: string, descriptor: PropertyDescriptor) {
        Server.bindRoute(new Alias(constructor, method), http_method, [_.kebabCase(constructor.name), path], options, descriptor.value.bind(constructor));
      };
    }

    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.BOOLEAN, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.EMAIL, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.FILE, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.PASSWORD, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.UUID, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.DATE, conditions?: Validator.DateParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.ENUM, conditions?: Validator.EnumParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.FLOAT, conditions?: Validator.FloatParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.INTEGER, conditions?: Validator.IntegerParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.ORDER, conditions?: Validator.OrderParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType.STRING, conditions?: Validator.StringParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: ValidatorType, conditions: any = {}, options: Server.EndpointParameterOptions = {}): Decorator {
      return (constructor: DecoratorConstructor, method: string) => {
        switch (type) {
          case ValidatorType.BOOLEAN:
          case ValidatorType.EMAIL:
          case ValidatorType.PASSWORD:
          case ValidatorType.UUID:
            return Server.bindRouteParameter(new Alias(constructor, method), key as string, type, {}, conditions);
          default:
            return Server.bindRouteParameter(new Alias(constructor, method), key as string, type, conditions, options);
        }
      };
    }

    public static bindPagination<K extends Key<E>>(limit: number, columns: K[]) {
      return function (constructor: DecoratorConstructor, method: string) {
        const alias = new Alias(constructor, method);
        Server.bindRouteParameter(alias, "skip", ValidatorType.INTEGER, {min: 0}, {});
        Server.bindRouteParameter(alias, "size", ValidatorType.INTEGER, {min: 1, max: limit}, {});
        Server.bindRouteParameter(alias, "order", ValidatorType.ORDER, columns as string[], {array: true});
      };
    }

    //region    ----- Query methods -----

    protected static getEntityManager() {
      const manager = RequestContext.getEntityManager();
      if (!manager) throw new ServerException(500, "Request context not found.");
      return manager;
    }

    public static getMetadata() {
      return this.getEntityManager().getMetadata().get(this.name) as EntityMetadata<E>;
    }

    public static getRepository() {
      return this.getEntityManager().getRepository(this) as GetRepository<E & AnyEntity, EntityRepository<E>>;
    }

    //endregion ----- Query methods -----

  }

  return DatabaseEntity;
}

export interface Entity {
  instance: MikroORM;
  manager: EntityManager;

  defaultID: string;

  generateDataHash: () => string;
  generateShareHash: () => string;

  regexDataHash: RegExp;
  regexShareHash: RegExp;
}

type Ordering = {[key: string]: Order}
type Decorator = <T>(target: DecoratorConstructor, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;

export type CountOptions<E> = Omit<FindOptions<Constructor<E>>, "orderBy">
export type FindOneOptions<E> = Omit<FindOptions<Constructor<E>>, "orderBy" | "offset" | "limit"> & {order?: Ordering}
export type FindManyOptions<E> = Omit<FindOptions<E>, "orderBy" | "offset"> & {skip?: number, order?: Ordering}

export interface Pagination {
  skip?: number;
  limit?: number;
  order?: Ordering;
}
