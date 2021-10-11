import {v4} from "uuid";
import RichTextCharacter, {RichTextCharacterValueInit} from "./RichTextCharacter";

export default class RichTextSection {
  
  #id: string;
  #value: RichTextCharacter[];
  #decoration: (keyof HTMLElementTagNameMap)[];
  
  constructor(value?: RichTextCharacterValueInit, decoration: (keyof HTMLElementTagNameMap)[] = []) {
    this.#id = v4();
    this.#value = RichTextCharacter.parseText(value);
    this.#decoration = decoration;
  }
  
  public get length() {
    return this.#value.length;
  }
  
  public get id() {
    return this.#id;
  }
  
  public get value() {
    return [...this.#value];
  }
  
  public get decoration() {
    return this.#decoration;
  }
  
  public at(id: number) {
    return this.#value.at(id);
  }
  
  public slice(start: number = this.length, end: number = start) {
    return new RichTextSection(this.#value.slice(start, end));
  }
  
  public splice(insert: RichTextCharacter | RichTextCharacter[], start: number = this.length, end: number = start) {
    const first = this.#value.slice(0, start);
    const last = this.#value.slice(end);
    return new RichTextSection([...first, ...(Array.isArray(insert) ? insert : [insert]), ...last], this.decoration);
  }
  
  public insert(insert: RichTextCharacter | RichTextCharacter[], position?: number) {
    const value = Array.isArray(insert) ? insert : [insert];
    return !position
           ? new RichTextSection([...this.#value, ...value])
           : new RichTextSection([...this.#value.slice(0, position), ...value, ...this.#value.slice(position)]);
  }
  
  public getCharacter(id: number | string, safe?: true): RichTextCharacter
  public getCharacter(id: number | string, safe?: false): RichTextCharacter | undefined
  public getCharacter(id: number | string, safe: boolean = false): RichTextCharacter | undefined {
    const value = typeof id === "number" ? this.#value.at(id) : this.#value.find(section => section.id === id);
    if (!value && safe) throw new Error("Could not find section");
    return value;
  }
  
  public static parseText(text?: RichTextSectionValueInit): RichTextSection[] {
    if (text instanceof RichTextSection) {
      return [new RichTextSection(text.value)];
    }
    
    if (typeof text === "string") {
      return [new RichTextSection(RichTextCharacter.parseText(text))];
    }
    
    if (Array.isArray(text)) {
      const value = [] as RichTextSection[];
      for (let i = 0; i < text.length; i++) {
        const item = text.at(i);
        if (!item) continue;
        value.push(...this.parseText(item));
      }
      return value;
    }
    
    return [];
  }
  
  public static parseHTML(node: Node): RichTextSection[] {
    if (node instanceof HTMLBRElement) {
      return [new RichTextSection(), new RichTextSection()];
    }
    
    if (node instanceof Text) {
      return this.parseText(node.data);
    }
    
    if (node instanceof HTMLElement) {
      const value = [] as RichTextSection[];
      for (let i = 0; i < node.children.length; i++) {
        const item = node.childNodes.item(i);
        if (item) value.push(new RichTextSection(RichTextCharacter.parseHTML(item)));
      }
      return value;
    }
    
    return [];
  }
  
}

export type RichTextSectionValueInit = RichTextSection | string | (RichTextSection | string)[]
