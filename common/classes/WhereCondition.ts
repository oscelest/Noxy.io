import {Query, NonFunctionPropertyNames, ExpandProperty, FilterValue, Scalar, OperatorMap} from "@mikro-orm/core/typings";

export default class WhereCondition<E extends {new(): any}, I extends Properties<InstanceType<E>> = Properties<InstanceType<E>>> {

  #entity: E;

  public $or?: Query<I>[];
  public $and?: Query<I>[];

  [key: string]: undefined | OperatorMap<Scalar | Scalar[]> | Query<I> | Query<I>[] | Function

  constructor(entity: E, filter?: Query<I>) {
    this.#entity = entity;

    if (filter) {
      Object.assign(this, filter);
    }
  }

  public andValue(filter: PropertyArray<I>) {
    for (let key in filter) {
      const value = filter[key];
      if (value === undefined || Array.isArray(value) && value.length === 0) continue;
      this[key as string] = Array.isArray(value) ? {$in: value} : {$eq: value};
    }

    return this;
  }

  public andWildcard(filter: Property<I>) {
    for (let key in filter) {
      const value = filter[key];
      if (value === undefined || Array.isArray(value) && value.length === 0) continue;
      this[key as string] = {$like: `%${value}%`};
    }

    return this;
  }

  public andExclusion(filter: PropertyArray<I>) {
    for (let key in filter) {
      const value = filter.hasOwnProperty(key) ? filter[key] : undefined;
      if (value === undefined || Array.isArray(value) && value.length === 0) continue;
      this[key as string] = Array.isArray(value) ? {$nin: value} : {$ne: value};
    }

    return this;
  }

  public andOr(...filter_list: Query<I>[]) {
    this.$or = filter_list;

    return this;
  }

  public and(...filter_list: Query<I>[]) {
    this.$and = filter_list;

    return this;
  }

  // public static addBooleanClause(qb: TypeORM.SelectQueryBuilder<E>, key: Key<E>, flag?: boolean) {
  //   return flag !== undefined ? qb.andWhere(`${this.name}.${key} = :${key}`, {[key]: flag}) : qb;
  // }
  //
  // public static addRelationClause<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, key: K, relation_key: Key<E[K]>, value?: EntityID) {
  //   return value?.length ? qb.andWhere(`${key}.${relation_key} IN (:${relation_key}_${key})`, {[`${relation_key}_${key}`]: value}) : qb;
  // }
  //
  // public static addRelationWildcardClause<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, key: K, relation_key: Key<E[K]>, value?: string) {
  //   return value?.length ? qb.andWhere(`${key}.${relation_key} LIKE :${relation_key}_${key}`, {[`${relation_key}_${key}`]: `%${value}%`}) : qb;
  // }
  //
  // public static addRelationSetClause<K extends Key<E>>(qb: TypeORM.SelectQueryBuilder<E>, op: SetOperation, key: K, relation_key: Key<E[K]>, value?: EntityID) {
  //   if (!value?.length) return qb;
  //
  //   this.addRelationClause(qb, key, relation_key, value);
  //
  //   switch (op) {
  //     case SetOperation.UNION:
  //       return qb;
  //     case SetOperation.INTERSECTION:
  //       const parameter_key = `${key}_${relation_key}`;
  //       return qb.groupBy(`${this.name}.id`).having(`COUNT(DISTINCT ${key}.${relation_key}) = :${parameter_key}`, {[parameter_key]: Array.isArray(value) ? value.length : 1});
  //     default:
  //       throw new ServerException(400, {op}, "Set operation is invalid.");
  //   }
  // }

}

type Property<I extends {}> = { [K in keyof I]?: undefined | Scalar }
type PropertyArray<I extends {}> = { [K in keyof I]?: undefined | Scalar | Scalar[] }


type ExpandObject<U> = {
  [K in NonFunctionPropertyNames<U>]?: Query<ExpandProperty<U[K]>> | FilterValue<ExpandProperty<U[K]>> | null;
}
