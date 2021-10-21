import React from "react";
import Helper from "../../Helper";

export default class RichTextDecoration {
  
  public static default_font_family = Helper.FontFamilyList[7];
  public static default_font_size = Helper.FontSizeList[5];
  public static default_font_length = Helper.FontLengthList[0];
  
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
  
  constructor(initializer: Initializer<RichTextDecoration> = {}) {
    this.bold = initializer.bold ?? false;
    this.code = initializer.code ?? false;
    this.mark = initializer.mark ?? false;
    this.italic = initializer.italic ?? false;
    this.underline = initializer.underline ?? false;
    this.strikethrough = initializer.strikethrough ?? false;
    
    this.font_family = initializer.font_family ?? RichTextDecoration.default_font_family;
    this.font_size = initializer.font_size ?? RichTextDecoration.default_font_size;
    this.font_length = initializer.font_length ?? RichTextDecoration.default_font_length;
    
    this.color = initializer.color ?? "";
    this.background_color = initializer.background_color ?? "";
    
    this.link = initializer.link ?? "";
    this.selected = initializer.selected ?? false;
  }
  
  public toObject(): DecorationObject {
    return {
      bold:          this.bold,
      code:          this.code,
      mark:          this.mark,
      italic:        this.italic,
      underline:     this.underline,
      strikethrough: this.strikethrough,
      
      font_family: this.font_family,
      font_size:   this.font_size,
      font_length: this.font_length,
      
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
    if (this.font_family !== RichTextDecoration.default_font_family) styling.fontFamily = this.font_family;
    if (this.font_size + this.font_length !== RichTextDecoration.default_font_size + RichTextDecoration.default_font_length) styling.fontSize = this.font_size + this.font_length;
    
    return styling;
  }
  
  public toNode<K extends keyof HTMLElementTagNameMap>(tag: K, attributes: {[key: string]: string} = {}, ...children: Node[]): HTMLElementTagNameMap[K] {
    const node = Helper.createElementWithChildren(tag, attributes, ...children);
    
    if (this.color) node.style.color = this.color;
    if (this.background_color) node.style.backgroundColor = this.background_color;
    if (this.font_family !== RichTextDecoration.default_font_family) node.style.fontFamily = this.font_family;
    if (this.font_size + this.font_length !== RichTextDecoration.default_font_size + RichTextDecoration.default_font_length) node.style.fontSize = this.font_size + this.font_length;
    
    return node;
  }
  
  public equals(decoration: RichTextDecoration) {
    return Object.keys(this).every(key => this[key as keyof RichTextDecoration] === decoration[key as keyof RichTextDecoration]);
  }
  
  public getIntersection<O extends DecorationObject>(...target_list: O[]) {
    const initializer = this.toObject() as DecorationObject;
    
    for (let i = 0; i < target_list.length; i++) {
      const target = target_list[i];
      initializer.bold = RichTextDecoration.getBooleanIntersection(initializer.bold, target.bold);
      initializer.code = RichTextDecoration.getBooleanIntersection(initializer.code, target.code);
      initializer.mark = RichTextDecoration.getBooleanIntersection(initializer.mark, target.mark);
      initializer.italic = RichTextDecoration.getBooleanIntersection(initializer.italic, target.italic);
      initializer.underline = RichTextDecoration.getBooleanIntersection(initializer.underline, target.underline);
      initializer.strikethrough = RichTextDecoration.getBooleanIntersection(initializer.strikethrough, target.strikethrough);
      
      initializer.font_size = RichTextDecoration.getStringIntersection(initializer.font_size, target.font_size);
      initializer.font_family = RichTextDecoration.getStringIntersection(initializer.font_family, target.font_family);
      initializer.font_length = RichTextDecoration.getStringIntersection(initializer.font_length, target.font_length);
      
      initializer.color = RichTextDecoration.getStringIntersection(initializer.color, target.color);
      initializer.background_color = RichTextDecoration.getStringIntersection(initializer.background_color, target.background_color);
      
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
  
  public static parseHTML(node: HTMLElement, decoration: Initializer<RichTextDecoration> = {}) {
    const {fontSize, fontFamily, color, backgroundColor} = node.style;
    const [font_size, font_size_length] = fontSize.split(/(?<=[0-9]+)(?=[a-z]+)/);
    
    return new RichTextDecoration({
      link:          node instanceof HTMLAnchorElement ? node.href : decoration.link,
      bold:          node.tagName === "B" || node.tagName === "STRONG" || decoration.bold,
      italic:        node.tagName === "I" || decoration.italic,
      underline:     node.tagName === "U" || decoration.underline,
      strikethrough: node.tagName === "S" || decoration.strikethrough,
      code:          node.tagName === "CODE" || decoration.code,
      mark:          node.tagName === "MARK" || decoration.mark,
      
      font_family: fontFamily || decoration.font_family || RichTextDecoration.default_font_family,
      font_size:   font_size || decoration.font_size || RichTextDecoration.default_font_size,
      font_length: font_size_length || decoration.font_length || RichTextDecoration.default_font_length,
      
      color:            color || decoration.color || "",
      background_color: backgroundColor || decoration.background_color || "",
    });
  }
  
}

export type DecorationObject = Writeable<Properties<RichTextDecoration>>;
