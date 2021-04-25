import _ from "lodash";
import React from "react";
import Order from "../common/enums/Order";
import FatalException from "./exceptions/FatalException";

namespace Util {

  export const Canvas = process.browser ? document.createElement("canvas") : null;

  export function getReactChildObject<O extends {} | [], V extends Unwrap<O>>(element: HTMLElement, object: O): V | undefined {
    return object[getChildKey(element, object)] as V;
  }

  export function getChildKey<O extends {} | []>(element: HTMLElement, object: O): keyof O {
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
          "Your browser does not permit this website to copy to the clipboard. Please enable this functionality if you wish to copy this text to the clipboard."
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
      console.log(textarea.value);
      textarea.remove();
    }
  }

}

export default Util;
