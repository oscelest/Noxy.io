import {Query, PlainObject, OperatorMap} from "@mikro-orm/core/typings";
import BaseEntity from "./BaseEntity";
import Util from "../services/Util";

export default class WhereCondition<E extends {new(): any}, I extends Properties<InstanceType<E>> = Properties<InstanceType<E>>> extends PlainObject {

  private static restrictedKeys: (keyof OperatorMap<any> | string)[] = [
    "$and", "$or", "$eq", "$ne", "$in", "$nin", "$not", "$gt", "$gte", "$lt", "$lte", "$like", "$re", "$ilike", "$overlap", "$contains", "$contained",
  ];

  [key: string]: Property<I>

  constructor(entity: E, filter?: Query<I>) {
    super();

    if (filter) {
      Object.assign(this, WhereCondition.transform(filter));
    }
  }

  public andOr(...filter_list: Condition<I>[]) {
    this.$or = filter_list.map(value => WhereCondition.transform(value));

    return this;
  }

  public andWildcard(filter: Condition<I>) {
    return Object.assign(this, WhereCondition.transform(filter, WhereCondition.andWildcardTransformer));
  }

  private static andWildcardTransformer<I>(value: Condition<I>, key: string | number): Query<Initializer<I>> {
    if (Array.isArray(value)) {
      return {$or: value.map((value) => ({[key]: {$like: `%${value}%`}}))};
    }

    return {$like: `%${value}%`};
  }

  public andExclusion(filter: Condition<I>) {
    return Object.assign(this, WhereCondition.transform(filter, WhereCondition.andExclusionTransformer));
  }

  private static andExclusionTransformer<I>(value: Condition<I>, key: string | number): Query<Initializer<I>> {
    if (Array.isArray(value)) {
      return {$nin: value};
    }

    return {[key]: {$ne: value}};
  }

  private static transform<I>(object: Condition<I> = {}, transformer?: TransformFunction<I>, visited: any[] = []): Condition<I> {
    if (object instanceof BaseEntity || typeof object !== "object" || visited.includes(object)) return object;

    if (Array.isArray(object)) {
      return object.reduce(
        (result, value) => {
          const parsed = this.transform(value, transformer, [...visited, object]);
          if (parsed === undefined || typeof parsed === "object" && !Util.size(parsed)) return result;
          return [...result, parsed];
        },
        [],
      ) as Condition<I>;
    }

    return Object.entries(object as Object).reduce(
      (result, [key, value]) => {
        if (WhereCondition.restrictedKeys.includes(key)) return {...result, [key]: value};
        if (Array.isArray(value)) {
          const filtered = value.filter(value => value !== undefined);
          if (!filtered.length) return result;

          return this.transformAssignResult(result, filtered, key, transformer);
        }
        if (typeof value !== "object") {
          return this.transformAssignResult(result, value, key, transformer);
        }

        const parsed = this.transform(value, transformer, [...visited, object]);
        if (parsed === undefined || typeof parsed === "object" && !Util.size(parsed)) return result;
        return {...result, [key]: parsed};
      },
      {},
    ) as Condition<I>;
  }

  private static transformAssignResult<I>(result: object, value: Condition<I>, key: string | number, transformer?: TransformFunction<I>) {
    if (value === undefined) {
      return result;
    }

    if (transformer === undefined) {
      return value ? this.transformAssignValue(result, value, key) : result;
    }

    const transformed = transformer(value, key);
    return transformed ? this.transformAssignValue(result, value, key) : result;
  }

  private static transformAssignValue<I>(result: object, value: Condition<I>, key: string | number) {
    return typeof value !== "object" || Array.isArray(value) ? {...result, [key]: value} : {...result, ...value as Object};
  }
}

export type Condition<I> = undefined | Query<Initializer<I>>
type Property<I> = Condition<I> | Condition<I>[] | Function
type TransformFunction<I> = (value: Condition<I>, key: string | number) => Query<Initializer<I>>
