import {CSSProperties} from "react";
import {v4} from "uuid";
import Util from "../../common/services/Util";
import Character from "./Character";
import Decoration, {DecorationObject} from "./Decoration";

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
  
  public hasDecoration(property: keyof Initializer<Decoration>, start: number, end: number) {
    for (let i = start; i < end; i++) {
      if (!this.at(i, true).decoration[property]) {
        return false;
      }
    }
    return true;
  }
  
  public at(position: number, safe: true): Character
  public at(position: number, safe?: false): Character | undefined
  public at(position: number, safe: boolean = false): Character | undefined {
    const character = this.value[position];
    if (!character && safe) throw new Error(`Could not get character at position [${position}]`);
    return character;
  }
  
  public getDecoration(start: number, end: number): Decoration {
    if (start === 0 && end === 0) return new Decoration();
    
    let initializer = this.at(start, true).decoration;
    for (let i = start + 1; i < end; i++) {
      initializer = initializer.getIntersection(this.at(i, true).decoration);
    }
    
    return new Decoration(initializer);
  }
  
  public getLine(position: number): number {
    let count = 0;
    position = Util.clamp(position, this.length, 0);
    for (let i = 0; i < position; i++) {
      if (this.at(i)?.value === Character.linebreak) count++;
    }
    return count;
  }
  
  public getContent(start: number, end: number, [selection_start, selection_end]: [number, number] = [0, 0]): RichTextContent {
    const content = [] as RichTextContent;
    if (!this.at(start) || !this.at(end - 1)) return content;
    
    content.push({start: 0, end: 0, index: 0, value: [{text: "", decoration: new Decoration().toObject(), start: 0, end: 0}]});
    for (let i = start; i < end; i++) {
      const line = content.at(-1);
      const segment = line?.value.at(-1);
      if (!line || !segment) continue;
      
      const character = this.at(i, true);
      const decoration = {...character.decoration.toObject(), selected: selection_start <= i && selection_end > i};
      
      segment.end = i;
      const start = i + 1;
      const end = i + 1;
      if (character.value === Character.linebreak) {
        content.push({start, end, index: content.length, value: [{text: "", decoration, start, end}]});
      }
      else if (!Util.getProperties(segment.decoration).every(key => segment.decoration[key] === decoration[key])) {
        line.value.push({text: character.value, decoration, start, end});
      }
      else {
        segment.text += character.value;
      }
    }
    
    return content;
  }
  
  public find(regex: RegExp, position: number, forward: boolean = true): number | undefined {
    if (!forward && position === 0 || forward && position === this.length) return undefined;
    position = forward ? position : position - 1;
    const character = this.at(position);
    if (!character) return undefined;
    return character.value.match(regex) ? position : this.find(regex, forward ? position + 1 : position, forward);
  };
  
  public slice(start?: number, end?: number) {
    return this.value.slice(start, end);
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
          array.push(new Character(initializer[j]));
        }
      }
      else if (initializer instanceof Character) {
        array.push(initializer);
      }
      else {
        array.push(...initializer.value);
      }
    }
    
    return array;
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

export type RichTextContent = RichTextLine[]

export interface RichTextLine {
  value: RichTextFragment[];
  index: number;
  start: number;
  end: number;
}

export interface RichTextFragment {
  text: string;
  decoration: DecorationObject;
  start: number;
  end: number;
}
