import _ from "lodash";
import * as TypeORM from "typeorm";
import EndpointParameterType from "../enums/server/EndpointParameterType";
import HTTPMethods from "../enums/server/HTTPMethods";
import SetOperation from "../enums/SetOperation";
import ServerException from "../exceptions/ServerException";
import Server from "../services/Server";
import Alias from "./Alias";

export default function Entity<E>() {

  abstract class Entity {

    // ----------------
    // Abstract methods
    // ----------------

    public abstract toJSON(): EntityJSONObject

    // ----------
    // Decorators
    // ----------

    public static [HTTPMethods.GET](path: string, options?: Server.EndpointOptions) {
      return this.bindRoute(HTTPMethods.GET, path, options);
    }

    public static [HTTPMethods.POST](path: string, options?: Server.EndpointOptions) {
      return this.bindRoute(HTTPMethods.POST, path, options);
    }

    public static [HTTPMethods.PUT](path: string, options?: Server.EndpointOptions) {
      return this.bindRoute(HTTPMethods.PUT, path, options);
    }

    public static [HTTPMethods.DELETE](path: string, options?: Server.EndpointOptions) {
      return this.bindRoute(HTTPMethods.DELETE, path, options);
    }

    private static bindRoute(http_method: HTTPMethods, path: string, options: Server.EndpointOptions = {}) {
      return function (constructor: Constructor, method: string, descriptor: PropertyDescriptor) {
        Server.bindRoute(new Alias(constructor, method), http_method, [_.kebabCase(constructor.name), path], options, descriptor.value.bind(constructor));
      };
    }

    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.BOOLEAN, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.EMAIL, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.FILE, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.PASSWORD, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.UUID, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.DATE, conditions?: Server.DateParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.ENUM, conditions?: Server.EnumParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.FLOAT, conditions?: Server.FloatParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.INTEGER, conditions?: Server.IntegerParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.ORDER, conditions?: Server.OrderParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType.STRING, conditions?: Server.StringParameterConditions, options?: Server.EndpointParameterOptions): Decorator
    public static bindParameter<R extends {}>(key: Key<R>, type: EndpointParameterType, conditions: any = {}, options: Server.EndpointParameterOptions = {}): Decorator {
      return (constructor: Constructor, method: string) => {
        switch (type) {
          case EndpointParameterType.BOOLEAN:
          case EndpointParameterType.EMAIL:
          case EndpointParameterType.PASSWORD:
          case EndpointParameterType.UUID:
            return Server.bindRouteParameter(new Alias(constructor, method), key as string, type, {}, conditions);
          default:
            return Server.bindRouteParameter(new Alias(constructor, method), key as string, type, conditions, options);
        }
      };
    }

    public static bindPagination<K extends Key<E>>(limit: number, columns: K[]) {
      return function (constructor: Constructor, method: string) {
        const alias = new Alias(constructor, method);
        Server.bindRouteParameter(alias, "skip", EndpointParameterType.INTEGER, {min: 0}, {});
        Server.bindRouteParameter(alias, "limit", EndpointParameterType.INTEGER, {min: 1, max: limit}, {});
        Server.bindRouteParameter(alias, "order", EndpointParameterType.ORDER, columns as string[], {flag_array: true});
      };
    }

    // ---------------
    // Utility methods
    // ---------------

    public static getRelationColumn<K extends Key<E>>(key: K): string
    public static getRelationColumn<K extends Key<E>>(key: K, relation_key: Key<E[K]>): string
    public static getRelationColumn<K extends Key<E>>(key: K, relation_key?: Key<E[K]>): string {
      return relation_key ? `${key}.${relation_key}` : `${this.name}.${key}`;
    }

    public static getRelationAlias<K extends Key<E>>(key: K): string
    public static getRelationAlias<K extends Key<E>>(key: K, relation_key: Key<E[K]>): string
    public static getRelationAlias<K extends Key<E>>(key: K, relation_key?: Key<E[K]>): string {
      return relation_key ? `join_${key}_${relation_key}` : key;
    }

    public static merge(entity: Entity & E, values: TypeORM.DeepPartial<Entity & E>): E {
      return TypeORM.getRepository(this).merge(entity, values) as unknown as E;
    }

    public static join<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, key: K): TypeORM.SelectQueryBuilder<E>
    public static join<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, key: K, relation_key: Key<E[K]>): TypeORM.SelectQueryBuilder<E>
    public static join<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, key: K, relation_key?: Key<E[K]>): TypeORM.SelectQueryBuilder<E> {
      return  qb.leftJoinAndSelect(this.getRelationColumn(key, relation_key!), this.getRelationAlias(key, relation_key!));
    }

    public static countRelation<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, column: Key<E>, key: K): TypeORM.SelectQueryBuilder<E>
    public static countRelation<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, column: Key<E>, key: K, relation_key: Key<E[K]>): TypeORM.SelectQueryBuilder<E>
    public static countRelation<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, column: Key<E>, key: K, relation_key?: Key<E[K]>): TypeORM.SelectQueryBuilder<E> {
      return  qb.loadRelationCountAndMap(`${this.name}.${column}`, this.getRelationColumn(key, relation_key!), this.getRelationAlias(key, relation_key!));
    }

    public static addValueClause<Q extends TypeORM.SelectQueryBuilder<E> | TypeORM.UpdateQueryBuilder<E> | TypeORM.DeleteQueryBuilder<E>>(qb: Q, key: Key<E>, value?: EntityID): Q {
      return (value?.length ? qb.andWhere(`${this.name}.${key} IN (:${key})`, {[key]: value}) : qb) as Q;
    }

    // ----------------
    // Where conditions
    // ----------------

    public static addExclusionClause(qb: TypeORM.SelectQueryBuilder<E>, key: Key<E>, value?: EntityID) {
      return value?.length ? qb.andWhere(`${this.name}.${key} NOT IN (:${key})`, {[key]: value}) : qb;
    }

    public static addBooleanClause(qb: TypeORM.SelectQueryBuilder<E>, key: Key<E>, flag?: boolean) {
      return flag !== undefined ? qb.andWhere(`${this.name}.${key} = :${key}`, {[key]: flag}) : qb;
    }

    public static addWildcardClause(qb: TypeORM.SelectQueryBuilder<E>, key: Key<E>, value?: string) {
      return value ? qb.andWhere(`${this.name}.${key} LIKE :${key}`, {[key]: `%${value}%`}) : qb;
    }

    public static addRelationClause<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, key: K, relation_key: Key<E[K]>, value?: EntityID) {
      return value?.length ? qb.andWhere(`${key}.${relation_key} IN (:${relation_key}_${key})`, {[`${relation_key}_${key}`]: value}) : qb;
    }

    public static addRelationWildcardClause<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, key: K, relation_key: Key<E[K]>, value?: string) {
      return value?.length ? qb.andWhere(`${key}.${relation_key} LIKE :${relation_key}_${key}`, {[`${relation_key}_${key}`]: `%${value}%`}) : qb;
    }

    public static addRelationSetClause<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, op: SetOperation, key: K, relation_key: Key<E[K]>, value?: EntityID) {
      if (!value?.length) return qb;

      this.addRelationClause(qb, key, relation_key, value);

      switch (op) {
        case SetOperation.UNION:
          return qb;
        case SetOperation.INTERSECTION:
          const parameter_key = `${key}_${relation_key}`;
          return qb.groupBy(`${this.name}.id`).having(`COUNT(DISTINCT ${key}.${relation_key}) = :${parameter_key}`, {[parameter_key]: Array.isArray(value) ? value.length : 1});
        default:
          throw new ServerException(400, {op}, "Set operation is invalid.");
      }
    }

    public static createRelation(relation: typeof Entity, path: Key<E> & string): TypeORM.RelationQueryBuilder<Entity & E> {
      return TypeORM.getRepository(this).createQueryBuilder().relation(relation, path) as TypeORM.RelationQueryBuilder<Entity & E>;
    }

    // --------------
    // Query builders
    // --------------

    public static createSelect(): TypeORM.SelectQueryBuilder<Entity & E> {
      return TypeORM.getRepository(this).createQueryBuilder().select() as TypeORM.SelectQueryBuilder<Entity & E>;
    }

    public static createPaginated({skip, limit, order}: Pagination): TypeORM.SelectQueryBuilder<E> {
      const query = this.createSelect();
      if (skip) query.skip(skip);
      if (limit) query.take(limit);
      if (order) query.orderBy(_.mapKeys(order, (sort, column) => !column.match(/\w+\.\w+/) ? `${this.name}.${column}` : column));
      return query as TypeORM.SelectQueryBuilder<E>;
    }

    public static createInsert(): TypeORM.InsertQueryBuilder<Entity & E> {
      return TypeORM.getRepository(this).createQueryBuilder().insert() as TypeORM.InsertQueryBuilder<Entity & E>;
    }

    public static createUpdate(): TypeORM.UpdateQueryBuilder<Entity & E> {
      return TypeORM.getRepository(this).createQueryBuilder().update() as TypeORM.UpdateQueryBuilder<Entity & E>;
    }

    public static createDelete(): TypeORM.DeleteQueryBuilder<Entity & E> {
      return TypeORM.getRepository(this).createQueryBuilder().delete() as TypeORM.DeleteQueryBuilder<Entity & E>;
    }

    public static async performSelect(id: string): Promise<Entity & E>
    public static async performSelect(id: string[]): Promise<(Entity & E)[]>
    public static async performSelect(id: string | string[]): Promise<(Entity & E) | (Entity & E)[]> {
      try {
        return Array.isArray(id)
          ? await this.createSelect().whereInIds(id).getMany()
          : await this.createSelect().whereInIds(id).getOneOrFail();
      }
      catch (error) {
        throw error;
      }
    }

    public static async performInsert(values: TypeORM.DeepPartial<Entity & E>) {
      const result = await this.createInsert().values(values).execute();
      if (result.raw && result.raw.affectedRows === 0) {
        throw new ServerException(500);
      }
      return await this.createSelect().where(result.identifiers).getOne() as Entity & E;
    }

    public static async performUpdate(id: string, values: TypeORM.DeepPartial<E>) {
      try {
        const result = await TypeORM.getRepository(this).update(id, values);
        if (result.affected === 1) return await this.createSelect().whereInIds(id).getOneOrFail();
      }
      catch (error) {
        throw error;
      }
      throw new ServerException(404);
    }

    public static async performDelete(id: string) {
      try {
        const entity = await this.performSelect(id);
        const result = await this.createDelete().andWhereInIds(id).execute();
        if (result.affected === 1) return entity;
      }
      catch (error) {
        throw error;
      }
      throw new ServerException(404);
    }
  }

  return Entity;
}

type EntityID = string | string[]
type EntityJSONObject = {[key: string]: EntityJSONPrimitives}
type EntityJSONPrimitives = undefined | null | boolean | number | string | Date | EntityJSONPrimitives[] | {[key: string]: EntityJSONPrimitives}
type Decorator = <T>(target: Constructor, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;

export interface Pagination {
  skip?: number
  limit?: number
  order?: {[key: string]: "ASC" | "DESC"}
}
