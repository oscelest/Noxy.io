import _ from "lodash";
import Order from "../enums/Order";

namespace Util {

  export function size(value: any) {
    if (typeof value === "string") return value.length;
    if (typeof value === "number") return value.toString().length;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (Array.isArray(value)) return value.length;
    if (typeof value === "object") {
      let size = 0;
      for (let key in value) size = value.hasOwnProperty(key) ? size + 1 : size;
      return size;
    }

    throw new Error(`Cannot get size of ${typeof value}`);
  }

  export function renderJSON(content: JSONObject) {
    return typeof content === "string" ? content : JSON.stringify(content, undefined, 2);
  }

  export function hasProperty<O extends object>(object: O, key: keyof O) {
    return object.hasOwnProperty(key);
  }

  export function getDuration(seconds: number) {
    const s = Math.floor(seconds % 3600 % 60);
    const m = Math.floor(seconds % 3600 / 60);

    if (seconds > 3600) {
      const h = Math.floor(seconds / 3600);
      return `${h}:${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
    }
    if (seconds > 60) {
      return `${m}:${s < 10 ? `0${s}` : s}`;
    }

    return `0:${s < 10 ? `0${s}` : s}`;
  }

  export function schedule(fn: Function, ...args: any[]) {
    return setTimeout(fn, 0, ...args);
  }

  export function getNextOrder(order?: Order) {
    return order === Order.DESC ? Order.ASC : (order === Order.ASC ? undefined : Order.DESC);
  }

  export function getSampleCount(count: number, size: number, minimum: number = 1) {
    return Math.ceil(count / (size > minimum - 1 ? size : minimum)) || minimum;
  }

  export function asObject(options: {[key: string]: any} | (string | number)[]): {[key: string]: any} {
    return Array.isArray(options) ? _.mapValues(_.invert(options), option => +option) : options;
  }

}

export default Util;
