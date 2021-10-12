import {v4} from "uuid";
import Decoration from "../Decoration";
import RichTextCharacter from "./RichTextCharacter";
import RichTextSection, {RichTextSectionSelection, RichTextSectionValueInit} from "./RichTextSection";

export default class RichText {
  
  public readonly id: string;
  public readonly value: RichTextSection[];
  
  constructor(value: RichTextSectionValueInit) {
    this.id = v4();
    this.value = RichTextSection.parseText(value);
  }
  
  public get length() {
    return this.value.reduce((result, section) => result + section.length, 0);
  }
  
  public at(section_id?: number, character_id?: number) {
    return this.getSection(section_id)?.getCharacter(character_id);
  }
  
  public getSection(id: number | string | undefined, safe: true): RichTextSection
  public getSection(id: number | string | undefined, safe?: false): RichTextSection | undefined
  public getSection(id: number | string | undefined, safe: boolean = false): RichTextSection | undefined {
    const value = typeof id === "string" ? this.value.find(section => section.id === id) : (typeof id === "number" ? this.value.at(id) : undefined);
    if (!value && safe) throw new Error("Could not find section");
    return value;
  }
  
  public hasDecoration(property: keyof Initializer<Decoration>, start: number, end: number) {
    for (let i = start; i < end; i++) {
      if (!this.at(i, 0)?.decoration[property]) {
        return false;
      }
    }
    return true;
  }
  
  public insert(insert: RichTextCharacter | RichTextSection | (RichTextCharacter | RichTextSection)[], selection: RichTextSelection) {
    const text = new RichText(this.value);
    
    selection.start_section = selection.start_section ?? 0;
    selection.end_section = selection.end_section ?? text.value.length;
  
    text.value[selection.end_section] = text.getSection(selection.start_section) ?? new RichTextSection();
    text.value[selection.start_section] = text.getSection(selection.end_section) ?? new RichTextSection();
    
    selection.start_character = selection.start_character ?? 0;
    selection.end_character = selection.end_character ?? text.value[selection.end_section].length;
    
    text.value[selection.start_section] = new RichTextSection([
      ...text.value[selection.end_section].value.slice(selection.end_character),
      ...text.value[selection.start_section].value.slice(0, selection.start_character)
    ]);
    text.value.splice(selection.start_section + 1, selection.end_section - selection.start_section - 1);
    
    insert = Array.isArray(insert) ? insert : [insert];
    for (let i = 0; i < insert.length; i++) {
      const item = insert.at(i);
      const section = text.getSection(selection.start_section, true);
      if (item instanceof RichTextSection) {
        const [first, last] = section.splitAt(selection.start_character);
        text.value.splice(selection.start_section, 1, first, section, last);
        selection.start_section++;
        selection.start_character = section.length;
      }
      else if (item instanceof RichTextCharacter) {
        section.value.splice(selection.start_character++, 0, item);
      }
    }
    
    return text;
  }
  
  public remove({start_section = 0, end_section = this.length, ...section}: RichTextSelection = {}) {
    const text = new RichText(this.value);
    
    for (let i = start_section; i <= end_section; i++) {
      const item = this.getSection(i, true);
      if (item && (i === start_section || i === end_section)) {
        const start_character = i === start_section ? section.start_character : 0;
        const end_character = i === end_section ? section.end_character : item.length;
        text.value[i] = item.remove({start_character, end_character});
      }
      else {
        text.value.splice(i--, 1);
      }
    }
    
    return text;
  }
  
  public decorate(decoration: Initializer<Decoration>, {start_section = 0, end_section = this.length, ...section}: RichTextSelection = {}) {
    const text = new RichText(this.value);
    
    for (let i = start_section; i <= end_section; i++) {
      const item = this.getSection(i, true);
      if (i === start_section || i === end_section) {
        const start_character = i === start_section ? section.start_character : 0;
        const end_character = i === end_section ? section.end_character : item.length;
        text.value[i] = item.decorate(decoration, {start_character, end_character});
      }
      else {
        text.value[i] = item.decorate(decoration);
      }
    }
    
    return text;
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

export type RichTextInsertSelection = Required<Pick<RichTextSelection, "start_section" | "start_character">>

export interface RichTextSelection extends RichTextSectionSelection {
  start_section?: number;
  end_section?: number;
}
