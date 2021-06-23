import _ from "lodash";
import Alias from "./Alias";
import HTTPMethod from "../enums/HTTPMethod";
import Validator from "../services/Validator";
import ValidatorType from "../enums/ValidatorType";
import ServerException from "../exceptions/ServerException";
import Server from "../services/Server";
import {EntityManager, MikroORM, Constructor, FindOptions, Collection} from "@mikro-orm/core";
import {Query} from "@mikro-orm/core/typings";
import Order from "../enums/Order";
import WhereCondition from "./WhereCondition";
import BaseEntity from "./BaseEntity";
import Database from "../services/Database";

export default function Entity<E>() {

  class Entity extends BaseEntity {

    // ----------
    // Decorators
    // ----------

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

    public static create(values: Initializer<E>): E {
      return Database.manager.create(this, values) as unknown as E;
    }

    public static where(where?: Query<E>) {
      return new WhereCondition(this, where);
    }

    public static async count(where: WhereCondition<typeof BaseEntity> | NonNullable<Query<E>>, options: CountOptions<E> = {}) {
      return await Database.manager.count(this, where, {...options}) as number;
    }

    public static async find(where: WhereCondition<typeof BaseEntity> | NonNullable<Query<E>>, options: FindManyOptions<E> = {}) {
      return await Database.manager.find(this, where, {...options, limit: options.limit, offset: options.skip, orderBy: options.order, populate: this.resolvePopulate(options.populate)}) as E[];
    }

    public static async findOne(where: WhereCondition<typeof BaseEntity> | NonNullable<Query<E>>, options: FindOneOptions<E> = {}) {
      try {
        return await Database.manager.findOneOrFail(this, where, {...options, orderBy: options.order, populate: this.resolvePopulate(options.populate)}) as E;
      }
      catch (error) {
        if (error.name === "NotFoundError") throw new ServerException(404, {entity: this.name});
        throw error;
      }
    }

    public static async populate(entities: E | E[], populate: Populate<E>) {
      return await Database.manager.populate(entities, populate);
    }

    public static async persist(object: Initializer<E>, values?: Initializer<E>) {
      try {
        if (!(object instanceof this)) object = this.create(object);
        if (values) {
          for (let key in values) {
            const property = key as keyof Initializer<E>;
            if (!values.hasOwnProperty(property) || values[property] === undefined) continue;
            object[property] = values[property];
          }
        }

        await Database.manager.persistAndFlush(object);
        return object as E;
      }
      catch (error) {
        if (error.code === "ER_DUP_ENTRY") throw new ServerException(409);
        throw error;
      }
    }

    public static async remove(where: WhereCondition<typeof BaseEntity> | NonNullable<Query<E>>, options: FindOneOptions<E> = {}) {
      const entity = await this.findOne(where, options);
      await Database.manager.removeAndFlush(entity);
      return entity;
    }

    private static resolvePopulate(object?: Populate<E>, prefix?: string): string[] {
      if (!object) return [];
      if (typeof object === "boolean") return object && prefix ? [prefix] : [];
      if (typeof object !== "object") return [prefix ? `${prefix}.${object}` : object.toString()];
      if (Array.isArray(object)) return _.map(object as string[], value => prefix ? `${prefix}.${value}` : value);
      return _.reduce(object, (result, value: any, key: string) => _.concat(result, this.resolvePopulate(value, prefix ? `${prefix}.${key}` : key)), [] as string[]);
    }

    //endregion ----- Query methods -----

  }

  return Entity;
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

type EntityID = string | string[]
type Ordering = {[key: string]: Order}
type EntityJSONObject = {[key: string]: EntityJSONPrimitives}
type EntityJSONPrimitives = undefined | null | boolean | number | string | Date | EntityJSONPrimitives[] | {[key: string]: EntityJSONPrimitives}
type Decorator = <T>(target: DecoratorConstructor, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;
type Populate<V> = keyof V | (keyof V)[] | { [K in keyof V]?: true | (V[K] extends Collection<infer R> ? Populate<R> : | Populate<V[K]>) }

type CountOptions<E> = Omit<FindOptions<Constructor<E>>, "populate" | "orderBy">
type FindOneOptions<E> = Omit<FindOptions<Constructor<E>>, "populate" | "orderBy" | "offset" | "limit"> & {populate?: Populate<E>, order?: Ordering}
type FindManyOptions<E> = Omit<FindOptions<Constructor<E>>, "populate" | "orderBy" | "offset"> & {populate?: Populate<E>, skip?: number, order?: Ordering}

export interface Pagination {
  skip?: number
  limit?: number
  order?: Ordering
}
