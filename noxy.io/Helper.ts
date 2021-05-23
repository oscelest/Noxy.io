import _ from "lodash";
import React from "react";
import Order from "../common/enums/Order";
import FatalException from "./exceptions/FatalException";

namespace Helper {

  export const Canvas = process.browser ? document.createElement("canvas") : null;

  export function renderJSON(content: JSONObject) {
    return typeof content === "string" ? content : JSON.stringify(content, undefined, 2);
  }

  export function hasProperty<O extends object>(object: O, key: keyof O) {
    return object.hasOwnProperty(key);
  }

  export function getQueryProp<V>(prop: undefined | string | string[]): string | undefined
  export function getQueryProp<V>(prop: undefined | string | string[], default_value: V): string | V
  export function getQueryProp<V>(prop: undefined | string | string[], default_value?: V): undefined | string | V {
    if (prop === undefined) return default_value;
    return (Array.isArray(prop) ? prop[0] : prop) || default_value;
  }

  export function submitForm(action: string, attributes: {[key: string]: string}): void
  export function submitForm(action: string, target: string, attributes: {[key: string]: string}): void
  export function submitForm(action: string, target: string | {[key: string]: string} = "_blank", attributes?: {[key: string]: string}) {
    const parsed_target = attributes ? target as string : "_blank";
    const parsed_attributes = attributes ? attributes : target as {[key: string]: string};

    const form = document.createElement("form");
    form.setAttribute("action", action);
    form.setAttribute("method", "post");
    form.setAttribute("target", parsed_target);

    for (let key in parsed_attributes) {
      const value = parsed_attributes[key];

      const input = document.createElement("input");
      input.setAttribute("type", "hidden");
      input.setAttribute("name", key);
      input.setAttribute("value", value);
      form.append(input);
    }

    document.getElementById("__next")?.append(form);
    form.submit();
    form.remove();
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

  export function getReactChildObject<O extends {} | [], V extends Unwrap<O>>(element: Element, object: O): V | undefined {
    return object[getChildKey(element, object)] as V;
  }

  export function getChildKey<O extends {} | []>(element: Element, object: O): keyof O {
    return _.keys(object)[_.findIndex(element.parentElement?.children, child => child === element)] as keyof O;
  }

  export function isolateEvent<E extends Event | React.SyntheticEvent>(handler: (event: E, ...args: any[]) => any) {
    return ((event: E, ...args: any[]) => {
      const result = handler(event, ...args);
      if (result !== event) {
        event.preventDefault();
        event.stopPropagation();
      }
      return result;
    });
  }

  export function getNextOrder(order?: Order) {
    return order === Order.DESC ? Order.ASC : (order === Order.ASC ? undefined : Order.DESC);
  }

  export function getPageTotal(count: number, size: number) {
    return Math.ceil(count / (size > 0 ? size : 1)) || 1;
  }

  export function getActiveElement() {
    return process.browser ? document.activeElement : null;
  }

  export function getChildrenLength(children: React.ReactNode | React.ReactNodeArray) {
    if (Array.isArray(children)) return children.length;
    if (typeof children === "number" || typeof children === "string" || typeof children === "boolean") return 1;
    return 0;
  }

  export function parseOptions(options: {[key: string]: any} | (string | number)[]): {[key: string]: any} {
    return Array.isArray(options) ? _.mapValues(_.invert(options), option => +option) : options;
  }

  export function getElementFont(element: HTMLElement) {
    if (!process.browser) return "Arial 14px/14px, sans-serif";
    return window.getComputedStyle(element).font;
  }

  export function getWidestText(texts: string | string[] = [], font: string = "normal normal 400 14px/14px Nunito, sans-serif") {
    const context = Canvas?.getContext("2d");
    if (!context) return 0;
    context.font = font;
    if (!Array.isArray(texts)) return context.measureText(texts).width;
    return _.reduce(texts, (result, text) => Math.ceil(Math.max(result, context.measureText(text).width)), 0);
  }


  export async function setClipboard(text: string) {
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({name: "clipboard-write"});
      if (permission.state == "granted" || permission.state == "prompt") {
        await navigator.clipboard.writeText(text);
      }
      else {
        throw new FatalException(
          "Could not copy to clipboard",
          "Your browser does not permit this website to copy to the clipboard. Please enable this functionality if you wish to copy this text to the clipboard.",
        );
      }
    }
    else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    else {
      const textarea = document.createElement("textarea");
      document.getElementById("__next")?.append(textarea);
      textarea.value = text;
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      document.execCommand("copy");
      textarea.remove();
    }
  }

}

export default Helper;
