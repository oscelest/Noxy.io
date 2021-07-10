import _ from "lodash";
import Order from "../../common/enums/Order";
import BaseEntity from "../../common/classes/Entity/BaseEntity";

export default class RequestData {

  readonly #parameter_collection: RequestDataCollection;
  readonly #file_list: File[];

  constructor(data?: Partial<RequestDataCollection> | BaseEntity) {
    this.#parameter_collection = _.pickBy(data ?? {}, value => value !== undefined) as RequestDataCollection;
    this.#file_list = [];
  }

  public append(key: string, value?: RequestDataParameter) {
    if (!key || value === undefined) return this;
    if (Array.isArray(this.#parameter_collection[key])) {
      (this.#parameter_collection[key] as RequestDataPrimitive[]).push(value);
    }
    else {
      this.#parameter_collection[key] = value;
    }
    return this;
  }

  public appendFile(file: File | File[] | FileList) {
    if (Array.isArray(file)) {
      this.#file_list.push(...file);
    }
    else if (file instanceof File) {
      this.#file_list.push(file);
    }
    else if (file instanceof FileList) {
      this.#file_list.push(..._.map(file));
    }
    else {
      throw new Error();
    }
    return this;
  }

  public paginate<T>(pagination: RequestPagination<T>) {
    if (pagination?.skip && !Number.isNaN(+pagination.skip) && +pagination.skip >= 0) {
      this.#parameter_collection.skip = pagination.skip;
    }
    if (pagination?.limit && !Number.isNaN(+pagination.limit) && +pagination.limit > 0) {
      this.#parameter_collection.limit = pagination.limit;
    }
    if (_.some(pagination?.order)) {
      this.#parameter_collection.order = _.reduce(
        pagination.order,
        (result, value, key) => value ? [...result, `${value === Order.ASC ? "" : "-"}${key}`] : result,
        [] as string[],
      );
    }
    return this;
  }

  public toFormData() {
    const data = new FormData();
    for (let key in this.#file_list) data.append("data", this.#file_list[key]);
    for (let key in this.#parameter_collection) {
      if (!this.#parameter_collection.hasOwnProperty(key)) continue;
      const parameter = this.#parameter_collection[key];
      if (Array.isArray(parameter)) {
        for (let index in parameter) {
          if (!parameter.hasOwnProperty(index)) continue;
          data.append(key, this.parseValue(parameter[index]));
        }
      }
      else {
        data.append(key, this.parseValue(parameter));
      }
    }
    return data;
  }

  public toObject() {
    return _.mapValues(this.#parameter_collection, value => this.parseValue(value));
  }

  public toString() {
    return _.join(_.filter(_.map(this.#parameter_collection, (value, key) => {
      if (Array.isArray(value)) {
        return _.map(value, sub_value => `${key}=${this.parseValue(sub_value)}`).join("&");
      }
      return `${key}=${this.parseValue(value as RequestDataPrimitive)}`;
    })), "&");
  }

  private parseValue(value: RequestDataPrimitive): string
  private parseValue(value: RequestDataParameter): string | string[] {
    if (Array.isArray(value)) return _.map(value, sub_value => this.parseValue(sub_value));
    if (value === null) return "NULL";
    if (typeof value === "string") return value;
    if (typeof value === "boolean") return value ? "1" : "0";
    if (value instanceof BaseEntity) return value.getPrimaryID();

    const string = value?.toString() ?? "";
    if (string === "[object Object]") {
      return JSON.stringify(value);
    }
    return string;
  }
}

type RequestDataCollection = {[key: string]: RequestDataParameter}
type RequestDataParameter = RequestDataPrimitive | RequestDataPrimitive[]
type RequestDataPrimitive = null | boolean | number | string | object | Date | BaseEntity

