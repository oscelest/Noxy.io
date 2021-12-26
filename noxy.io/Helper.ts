import _ from "lodash";
import React from "react";
import RequestHeader from "../common/enums/RequestHeader";
import KeyboardCommand from "./enums/KeyboardCommand";

namespace Helper {
  
  export const Canvas = process.browser ? document.createElement("canvas") : null;
  export const FontFamilyList = ["Arial", "Helvetica", "Verdana", "Georgia", "Times New Roman", "Tahoma", "Trebuchet MS", "Nunito", "Garamond", "Courier New", "Brush Script MT"];
  export const FontSizeList = ["8", "9", "10", "11", "12", "14", "18", "24", "30", "36", "48", "60", "72", "84", "96"];
  export const FontLengthList = ["px", "pt", "em", "rem", "vw", "vmax", "%", "cm", "mm", "in", "pc", "ex", "ch"];
  
  export function getChildNodeByTextLength(node: Node, text_length: number): [Node, number] {
    for (let i = 0; i < node.childNodes.length; i++) {
      const item = node.childNodes.item(i);
      const length = Helper.getNodeTextLength(item);
      
      if (length < text_length) {
        text_length -= length;
      }
      else if (item instanceof Text) {
        return [item, text_length];
      }
      else {
        return getChildNodeByTextLength(item, text_length);
      }
    }
    
    return [node, text_length];
  }
  
  export function getNodeTextLength(node: Node) {
    if (node instanceof Text) return node.length;
    
    let value = 0;
    for (let i = 0; i < node.childNodes.length; i++) {
      const item = node.childNodes.item(i);
      if (item instanceof Text) {
        value += item.length;
      }
      else {
        value += getNodeTextLength(item);
      }
    }
    return value;
  }
  
  export async function request<Response = any, Request extends FormData = FormData>(url: string, form_data?: Request) {
    const response = await fetch(url, {
      body:    form_data,
      headers: {
        [RequestHeader.AUTHORIZATION]: localStorage.getItem(RequestHeader.AUTHORIZATION) ?? "",
      },
    });
    const result = await response.json();
    return result as Response;
  }
  
  export function invoke<V>(list?: V, ...params: V extends LambdaFn ? Parameters<V> : never): V extends LambdaFn ? ReturnType<V> : V {
    return typeof list === "function" ? list.apply(null, params) : list;
  }
  
  export function renderReactElementList(list?: HTMLTag | HTMLTag[], props?: React.HTMLProps<HTMLElement>, key: number = 0) {
    if (!Array.isArray(list)) return React.createElement(list ?? "div", props);
    
    let component = React.createElement(list.at(-1) ?? "div", props);
    for (let i = list.length - 2; i >= 0; i--) {
      const item = list.at(i);
      if (!item) continue;
      component = React.createElement(item, {key: i === 0 ? key : 0, children: component});
    }
    return component;
  }
  
  export function renderHTMLElementList(list?: HTMLTag | HTMLTag[], attributes?: {[key: string]: string}, ...children: Node[]) {
    if (!Array.isArray(list)) return Helper.createElementWithChildren(list ?? "div", attributes, ...children);
    if (list.length === 0) return Helper.createElementWithChildren("div", attributes);
    
    let component = Helper.createElementWithChildren(list.at(-1) ?? "div", attributes, ...children);
    for (let i = list.length - 2; i >= 0; i--) {
      const item = list.at(i);
      if (!item) continue;
      component = Helper.createElementWithChildren(item, attributes, component);
    }
    return component;
  }

  export function createElementWithContent<K extends keyof HTMLElementTagNameMap>(tag: K, attributes: {[key: string]: string} = {}, html: string): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    element.innerHTML = html;

    for (let key in attributes) {
      element.setAttribute(key, attributes[key]);
    }

    return element;
  }

  export function createElementWithChildren<K extends keyof HTMLElementTagNameMap>(tag: K, attributes: {[key: string]: string} = {}, ...children: Node[]): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    
    for (let key in attributes) {
      element.setAttribute(key, attributes[key]);
    }
    
    for (let i = 0; i < children.length; i++) {
      element.appendChild(children[i]);
    }
    
    return element;
  }
  
  export function renderHTMLText(text: string) {
    return text.replace(/(?<!\b)\s(?!\b)?|\s$/g, "\u00A0");
  }
  
  export function getClosestContainer(node: Node, parent: Node): Node {
    if (node.parentElement === null) throw "No parent element exists";
    if (node.parentElement !== parent) return getClosestContainer(node.parentElement, parent);
    return node;
  }
  
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
    return await navigator.clipboard.writeText(input);
  }
  
}

export default Helper;
