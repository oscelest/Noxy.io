import {CSSProperties} from "react";
import {v4} from "uuid";
import Character from "./Character";
import Decoration from "./Decoration";

type InitValue = string | Character | Character[] | RichText;

export default class RichText<Metadata = never> {
  
  readonly #id: string;
  readonly #value: Character[];
  
  public metadata: Metadata;
  public alignment: CSSProperties["textAlign"];
  
  public static attribute_metadata: string = "data-metadata";
  
  constructor(initializer: Initializer<Omit<RichText, "value" | "id">> & {metadata?: Metadata, value?: InitValue | InitValue[]}) {
    this.#id = v4();
    this.#value = this.parseInitializerValue(initializer.value);
    
    this.alignment = initializer?.alignment ?? "inherit";
    if (initializer?.metadata) this.metadata = initializer.metadata;
  }
  
  public get id() {
    return this.#id;
  }
  
  public get value() {
    return [...this.#value];
  }
  
  public get length() {
    return this.#value.length;
  }
  
  private parseInitializerValue(initializer?: InitValue | InitValue[]): Character[] {
    const array = [] as Character[];
    if (initializer === undefined) return array;
    
    if (Array.isArray(initializer)) {
      for (let i = 0; i < initializer.length; i++) {
        const value = initializer[i];
        if (value instanceof Character) {
          array.push(value);
        }
        else {
          array.push(...this.parseInitializerValue(value));
        }
      }
    }
    else {
      if (typeof initializer === "string") {
        for (let j = 0; j < initializer.length; j++) {
          this.value.push(new Character(initializer[j]));
        }
      }
      else if (initializer instanceof Character) {
        this.value.push(initializer);
      }
      else {
        this.value.push(...initializer.value);
      }
    }
    
    return array;
  }
  
  public at(position: number, safe: true): Character
  public at(position: number, safe?: false): Character | undefined
  public at(position: number, safe: boolean = false): Character | undefined {
    const character = this.value[position];
    if (!character && safe) throw new Error(`Could not get character at position [${position}]`);
    return character;
  }
  
  public slice(start?: number, end?: number) {
    return this.value.slice(start, end);
  }
  
  public static parseHTML(node: string | Element, decoration: Decoration = new Decoration()) {
    if (node instanceof Node) {
      return new RichText({value: Character.parseHTML(node, decoration), metadata: this.parseMetadata(node.getAttribute(RichText.attribute_metadata) ?? "")});
    }
    
    let metadata = undefined;
    const value = [] as Character[];
    const element = document.createElement("template");
    element.innerHTML = node.toString();
    for (let i = 0; i < element.content.children.length; i++) {
      const child = element.content.children[i];
      value.push(...Character.parseHTML(child, decoration));
      metadata = this.parseMetadata(child.getAttribute(RichText.attribute_metadata) ?? "", metadata);
    }
    
    return new RichText({value, metadata});
  }
  
  public static parseMetadata(value?: string, previous_value?: any) {
    if (!value) return previous_value ?? value;
    try {
      let parsed = JSON.parse(value);
      if (previous_value !== undefined) {
        if (Array.isArray(previous_value)) previous_value.push(parsed);
        if (typeof previous_value === "object" && typeof parsed === "object") return {...previous_value, ...parsed};
        return [previous_value, parsed];
      }
      return parsed;
    }
    catch (error) {
      return previous_value ?? undefined;
    }
  }
  
}
