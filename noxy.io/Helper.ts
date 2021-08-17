import _ from "lodash";
import FatalException from "./exceptions/FatalException";
import React from "react";
import KeyboardCommand from "./enums/KeyboardCommand";

namespace Helper {

  export const Canvas = process.browser ? document.createElement("canvas") : null;

  export function getKeyboardEventCommand(event: React.KeyboardEvent): KeyboardCommand {
    const parts = [] as string[];
    if (event.ctrlKey) parts.push("Ctrl");
    if (event.shiftKey) parts.push("Shift");
    if (event.altKey) parts.push("Alt");
    parts.push(event.code);
    return parts.join("+") as KeyboardCommand;
  }

  export function getAPIPath(...segment: string[]) {
    return process.browser ? `${location.protocol}//api.${location.hostname}/${segment.join("/")}` : "";
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

    document.append(form);
    form.submit();
    form.remove();
  }

  export function getReactChildObject<O extends {} | [], V extends Unwrap<O>>(element: Element, object: O): V | undefined {
    return object[getChildKey(element, object)] as V;
  }

  export function getChildKey<O extends {} | []>(element: Element, object: O): keyof O {
    return _.keys(object)[_.findIndex(element.parentElement?.children, child => child === element)] as keyof O;
  }

  export function getActiveElement() {
    return process.browser ? document.activeElement : null;
  }

  export function getWidestText(texts: string | string[] = [], font: string = "normal normal 400 14px/14px Nunito, sans-serif") {
    const context = Canvas?.getContext("2d");
    if (!context) return 0;
    context.font = font;
    if (!Array.isArray(texts)) return context.measureText(texts).width;
    return _.reduce(texts, (result, text) => Math.ceil(Math.max(result, context.measureText(text).width)), 0);
  }

  export async function setClipboard(input: string) {
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({name: "clipboard-write"});
      if (permission.state == "granted" || permission.state == "prompt") {
        return await navigator.clipboard.writeText(input);
      }

      throw new FatalException(
        "Could not copy to clipboard",
        "Your browser does not permit this website to copy to the clipboard. Please enable this functionality if you wish to copy this text to the clipboard.",
      );
    }

    const textarea = document.createElement("textarea");
    document.getElementById("__next")?.append(textarea);
    textarea.value = input;
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    document.execCommand("copy");
    textarea.remove();
  }

}

export default Helper;
