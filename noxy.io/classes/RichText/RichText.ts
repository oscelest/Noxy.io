import {v4} from "uuid";
import Decoration from "../Decoration";
import RichTextCharacter from "./RichTextCharacter";
import RichTextSection, {RichTextSectionValueInit} from "./RichTextSection";

export default class RichText {
  
  readonly #id: string;
  readonly #value: RichTextSection[];
  
  constructor(value: RichTextSectionValueInit) {
    this.#id = v4();
    this.#value = RichTextSection.parseText(value);
  }
  
  public get length() {
    return this.#value.reduce((result, section) => result + section.length, 0);
  }
  
  public get id() {
    return this.#id;
  }
  
  public get value() {
    return this.#value.map(section => new RichTextSection(section.value));
  }
  
  public at(section_id: number, character_id: number) {
    return this.getSection(section_id)?.getCharacter(character_id);
  }
  
  public slice(start: number = this.length, end: number = start) {
    return new RichText(this.#value.slice(start, end));
  }
  
  public splice(insert: RichTextSection | RichTextSection[], start: number = this.length, end: number = start) {
    const first = this.#value.slice(0, start);
    const last = this.#value.slice(end);
    return new RichText([...first, ...(Array.isArray(insert) ? insert : [insert]), ...last]);
  }
  
  public insert(insert: RichTextCharacter | RichTextSection | (RichTextCharacter | RichTextSection)[], section_id: number = -1, character_id: number  = -1) {
    if (insert instanceof RichTextSection) {
      return this.splice(insert, section_id + 1, section_id + 1);
    }
    
    if (insert instanceof RichTextCharacter) {
      return this.splice((this.#value.at(section_id) ?? new RichTextSection()).insert(insert, character_id), section_id, section_id);
    }
    
    let value: RichText = this;
    for (let i = 0; i < insert.length; i++) {
      const item = insert[i];
      value = value.insert(item, item instanceof RichTextSection ? section_id++ : section_id, item instanceof RichTextCharacter ? character_id++ : character_id);
    }
    return value;
  }
  
  public remove(start_section: number, start_character: number, end_section: number, end_character: number) {
    const value = this.value;
    for (let i = start_section; i <= end_section; i++) {
      if (i !== start_section && i !== end_section) {
        delete value[i];
        continue;
      }
      
      const item = this.getSection(i, true);
      const start = i === start_section ? start_character : 0;
      const end = i === end_section ? end_character : item.length;
      value[i] = item.slice(start, end);
    }
    return new RichText(value);
  }
  
  public hasDecoration(property: keyof Initializer<Decoration>, start: number, end: number) {
    for (let i = start; i < end; i++) {
      if (!this.at(i, 0).decoration[property]) {
        return false;
      }
    }
    return true;
  }
  
  public getSection(id: number | string, safe?: true): RichTextSection
  public getSection(id: number | string, safe?: false): RichTextSection | undefined
  public getSection(id: number | string, safe: boolean = false): RichTextSection | undefined {
    const value = typeof id === "number" ? this.#value.at(id) : this.#value.find(section => section.id === id);
    if (!value && safe) throw new Error("Could not find section");
    return value;
  }
  
  public static parseHTML(node: string | HTMLElement) {
    if (node instanceof HTMLElement) {
      return new RichText(RichTextSection.parseHTML(node));
    }
    
    const element = document.createElement("template");
    element.innerHTML = node;
    
    return new RichText(RichTextSection.parseHTML(element.content));
  }
  
}


