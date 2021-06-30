import {Query, Scalar, OperatorMap, PlainObject} from "@mikro-orm/core/typings";
import _ from "lodash";
import BaseEntity from "./BaseEntity";

export default class WhereCondition<E extends {new(): any}, I extends Properties<InstanceType<E>> = Properties<InstanceType<E>>> extends PlainObject {

  [key: string]: Prop<I>

  constructor(entity: E, filter?: Query<I>) {
    super();

    if (filter) {
      // TODO: Should be its own function
      Object.assign(this, WhereCondition.transform(filter));
    }
  }

  public andWildcard(filter: Prop<I>) {
    // TODO: Should be its own function
    return Object.assign(this, WhereCondition.transform(filter, (value: any) => ({$like: `%${value}%`})));
  }

  public andExclusion(filter: Prop<I>) {
    // TODO: Should be its own function
    return Object.assign(this, WhereCondition.transform(filter, (value: any) => ({$ne: value})));
  }

  public andOr(...filter_list: Query<Initializer<I>>[]) {
    this.$or = WhereCondition.transform(filter_list);

    return this;
  }

  public and(...filter_list: Query<Initializer<I>>[]) {
    this.$and = WhereCondition.transform(filter_list);

    return this;
  }

  private static transform(object: any = {}, transform?: Function, visited: any[] = []): any {
    if (object instanceof BaseEntity || visited.includes(object) || typeof object !== "object") return transform?.(object) ?? object;

    const type = Array.isArray(object);
    return _.reduce(
      object,
      (result, value, key) => {
        const parsed = this.transform(value, transform, [...visited, object]);
        const valid = typeof parsed === "object" ? _.size(parsed) : parsed !== undefined
        return valid ? type ? [...result as [], parsed] : {...result, [key]: parsed} : result;
      },
      Array.isArray(object) ? [] : {},
    );
  }

  private static parseValue(value: any): any {
    if (Array.isArray(value)) return _.map(value, v => v instanceof BaseEntity ? v.getPrimaryKey() : v);
    if (value instanceof BaseEntity) return value.getPrimaryID();
    if (typeof value === "object") return _.mapValues(value, v => this.parseValue(v));
    return value;
  }
}

type Prop<I> = undefined | OperatorMap<Scalar | Scalar[]> | Query<Initializer<I>> | Query<Initializer<I>>[] | Function

