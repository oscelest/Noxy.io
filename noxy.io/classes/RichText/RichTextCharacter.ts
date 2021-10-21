import {v4} from "uuid";
import RichTextDecoration from "./RichTextDecoration";

export default class RichTextCharacter {
  
  readonly #id: string;
  readonly #value: string;
  readonly #decoration: RichTextDecoration;
  
  public static tab: string = "\t";
  public static linebreak: string = "\n";
  public static space: string = " ";
  
  constructor(value: string, decoration?: Initializer<RichTextDecoration>) {
    this.#id = v4();
    this.#value = value.charAt(0) ?? " ";
    this.#decoration = new RichTextDecoration(decoration);
  }
  
  public get id() {
    return this.#id;
  }
  
  public get value() {
    return this.#value;
  }
  
  public get decoration() {
    return this.#decoration;
  }
  
  public static parseText(text?: RichTextCharacterValueInit): RichTextCharacter[] {
    const value = [] as RichTextCharacter[];
  
    if (text instanceof RichTextCharacter) {
      value.push(text);
    }
    else if (typeof text === "string") {
      for (let i = 0; i < text.length; i++) {
        const item = text.at(i);
        if (item) value.push(new RichTextCharacter(item));
      }
    }
    else if (text !== undefined) {
      for (let i = 0; i < text.length; i++) {
        const item = text.at(i);
        if (item) value.push(...this.parseText(item));
      }
    }
    
    return value;
  }
  
  public static parseHTML(node: Node, decoration?: RichTextDecoration) {
    const value = [] as RichTextCharacter[];

    if (node instanceof HTMLBRElement) {
      value.push(new RichTextCharacter(RichTextCharacter.linebreak, decoration));
    }
    else if (node instanceof Text) {
      for (let i = 0; i < node.data.length; i++) {
        const item = node.data.at(i);
        if (item) value.push(new RichTextCharacter(item, decoration));
      }
    }
    else if (node instanceof HTMLElement) {
      decoration = RichTextDecoration.parseHTML(node, decoration);
      for (let i = 0; i < node.children.length; i++) {
        const item = node.childNodes.item(i);
        if (item) value.push(...this.parseHTML(item, decoration));
      }
    }
    
    return value;
  }
  
}

export type RichTextCharacterValueInit = RichTextCharacter | string | (RichTextCharacter | string)[];
