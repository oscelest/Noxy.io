import React from "react";
import Helper from "../../Helper";

export default class RichTextDecoration {

  public readonly bold: boolean;
  public readonly code: boolean;
  public readonly mark: boolean;
  public readonly italic: boolean;
  public readonly underline: boolean;
  public readonly strikethrough: boolean;

  public readonly font_size: string;
  public readonly font_length: string;
  public readonly font_family: string;
  public readonly color: string;
  public readonly background_color: string;

  public readonly link: string;
  public readonly selected: boolean;

  constructor(initializer: RichTextDecorationInitializer = {}) {
    this.bold = initializer.bold ?? false;
    this.code = initializer.code ?? false;
    this.mark = initializer.mark ?? false;
    this.italic = initializer.italic ?? false;
    this.underline = initializer.underline ?? false;
    this.strikethrough = initializer.strikethrough ?? false;

    this.font_family = initializer.font_family ?? "";
    this.font_size = initializer.font_size ?? "";
    this.font_length = initializer.font_length ?? "";

    this.color = initializer.color ?? "";
    this.background_color = initializer.background_color ?? "";

    this.link = initializer.link ?? "";
    this.selected = initializer.selected ?? false;
  }

  public toObject(): RichTextDecorationObject {
    return {
      bold:          this.bold,
      code:          this.code,
      mark:          this.mark,
      italic:        this.italic,
      underline:     this.underline,
      strikethrough: this.strikethrough,

      font_family:      this.font_family,
      font_size:        this.font_size,
      font_length:      this.font_length,
      color:            this.color,
      background_color: this.background_color,

      link:     this.link,
      selected: this.selected,
    };
  }

  public toCSSProperties() {
    const styling = {} as React.CSSProperties;

    if (this.color) styling.color = this.color;
    if (this.background_color) styling.backgroundColor = this.background_color;
    if (this.font_family) styling.fontFamily = this.font_family;
    if (this.font_size + this.font_length) styling.fontSize = this.font_size + this.font_length;

    return styling;
  }

  public toNode<K extends keyof HTMLElementTagNameMap>(tag: K, attributes: {[key: string]: string} = {}, ...children: Node[]): HTMLElementTagNameMap[K] {
    const node = Helper.createElementWithChildren(tag, attributes, ...children);

    if (this.color) node.style.color = this.color;
    if (this.background_color) node.style.backgroundColor = this.background_color;
    if (this.font_family) node.style.fontFamily = this.font_family;
    if (this.font_size + this.font_length) node.style.fontSize = this.font_size + this.font_length;

    return node;
  }

  public clone() {
    return new RichTextDecoration(this);
  }

  public equals(decoration: RichTextDecoration) {
    return Object.keys(this).every(key => this[key as keyof RichTextDecoration] === decoration[key as keyof RichTextDecoration]);
  }

  public union(...target_list: Partial<RichTextDecorationObject>[]) {
    const union = RichTextDecoration.getUnion(this, ...target_list);
    return new RichTextDecoration({...this, ...union});
  }

  public static getUnion(...[first, ...rest]: Partial<RichTextDecorationObject>[]) {
    const initializer = {...first ?? {}} as Partial<RichTextDecorationObject>;

    for (let i = 0; i < rest.length; i++) {
      const target = rest[i];
      initializer.bold = RichTextDecoration.getBooleanIntersection(initializer.bold, target.bold);
      initializer.code = RichTextDecoration.getBooleanIntersection(initializer.code, target.code);
      initializer.mark = RichTextDecoration.getBooleanIntersection(initializer.mark, target.mark);
      initializer.italic = RichTextDecoration.getBooleanIntersection(initializer.italic, target.italic);
      initializer.underline = RichTextDecoration.getBooleanIntersection(initializer.underline, target.underline);
      initializer.strikethrough = RichTextDecoration.getBooleanIntersection(initializer.strikethrough, target.strikethrough);
      initializer.link = RichTextDecoration.getStringIntersection(initializer.link, target.link);
    }

    return new RichTextDecoration(initializer);
  }

  private static getBooleanIntersection(current?: boolean, target?: boolean) {
    return current === false ? current : !!target;
  }

  private static getStringIntersection(current?: string, target?: string) {
    if (current === undefined && target !== undefined) return target;
    if (current !== undefined && target === undefined) return current;
    if (current === undefined || target === undefined || target !== current) return "";
    return current;
  }

  public static parseHTML(node: HTMLElement, decoration?: RichTextDecorationInitializer): RichTextDecoration {
    if (!node || !(node instanceof HTMLElement)) return new RichTextDecoration(decoration);

    const {fontWeight, fontStyle, textDecoration, fontFamily, fontSize, color, backgroundColor} = getComputedStyle(node);

    return new RichTextDecoration({
      bold:          this.parseNodeBold(node, fontWeight.toLowerCase()) || decoration?.bold,
      italic:        this.parseNodeItalic(node, fontStyle.toLowerCase()) || decoration?.italic,
      underline:     this.parseNodeUnderline(node, textDecoration.toLowerCase()) || decoration?.underline,
      strikethrough: this.parseNodeStrikethrough(node, textDecoration.toLowerCase()) || decoration?.strikethrough,

      font_family: this.parseNodeFontFamily(fontFamily) || decoration?.font_family,
      font_size:   this.parseNodeFontSize(fontSize) || decoration?.font_size,
      font_length: this.parseNodeFontLength(fontSize) || decoration?.font_length,

      color:            color || decoration?.color,
      background_color: backgroundColor || decoration?.background_color,

      link: this.parseNodeLink(node) || decoration?.link,
      code: this.parseNodeCode(node) || decoration?.code,
      mark: this.parseNodeMark(node) || decoration?.mark,
    });
  }

  private static parseNodeBold(element: HTMLElement, style: CSSStyleDeclaration["fontWeight"]) {
    return element.tagName === "B" || element.tagName === "STRONG" || style.includes("bold") || style.includes("700");
  }

  private static parseNodeItalic(element: HTMLElement, style: CSSStyleDeclaration["fontStyle"]) {
    return element.tagName === "I" || style.includes("italic");
  }

  private static parseNodeUnderline(element: HTMLElement, style: CSSStyleDeclaration["textDecoration"]) {
    return element.tagName === "U" || style.includes("underline");
  }

  private static parseNodeStrikethrough(element: HTMLElement, style: CSSStyleDeclaration["textDecoration"]) {
    return element.tagName === "S" || style.includes("line-through");
  }

  private static parseNodeFontFamily(style: CSSStyleDeclaration["fontFamily"]) {
    return style.replace(/\s*,.*/, "");
  }

  private static parseNodeFontSize(style: string) {
    return style.match(/^(?<size>\d+)/)?.groups?.size || "";
  }

  private static parseNodeFontLength(style: string) {
    return style.match(/(?<length>\D+)$/)?.groups?.length || "";
  }

  private static parseNodeLink(node: HTMLElement, current: string = "") {
    return node instanceof HTMLAnchorElement ? node.href : current;
  }

  private static parseNodeCode({tagName}: HTMLElement, current: boolean = false) {
    return tagName === "CODE" || current;
  }

  private static parseNodeMark({tagName}: HTMLElement, current: boolean = false) {
    return tagName === "MARK" || current;
  }
}

export type RichTextDecorationObject = Writeable<Properties<RichTextDecoration>>;
export type RichTextDecorationInitializer = Initializer<RichTextDecoration>;
