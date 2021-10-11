import {v4} from "uuid";
import Decoration from "../Decoration";

export default class RichTextCharacter {
  
  #id: string;
  #value: string;
  #decoration: Decoration;
  
  public static tab: string = "\t";
  public static linebreak: string = "\n";
  
  constructor(value: string, decoration: Decoration = new Decoration()) {
    this.#id = v4();
    this.#value = value.charAt(0) ?? " ";
    this.#decoration = new Decoration();
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
  
  public static parseHTML(node: Node, decoration?: Decoration) {
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
      decoration = Decoration.parseHTML(node, decoration);
      for (let i = 0; i < node.children.length; i++) {
        const item = node.childNodes.item(i);
        if (item) value.push(...this.parseHTML(item, decoration));
      }
    }
    
    return value;
  }
  
}

export type RichTextCharacterValueInit = RichTextCharacter | string | (RichTextCharacter | string)[];
