import {v4} from "uuid";
import Decoration from "../Decoration";
import RichTextCharacter from "./RichTextCharacter";
import RichTextSection, {RichTextSectionSelection, RichTextSectionValueInit} from "./RichTextSection";

export default class RichText<Metadata = never> {
  
  public readonly id: string;
  public readonly value: RichTextSection[];
  public readonly metadata: Metadata;
  
  constructor(value?: RichTextSectionValueInit) {
    this.id = v4();
    this.value = RichTextSection.parseText(value);
  }
  
  public get text() {
    return this.value.map(section => section.text);
  }
  
  public get size() {
    return this.value.reduce((result, section) => result + section.length, 0);
  }
  
  public get length() {
    return this.value.length;
  }
  
  public slice({...selection}: RichTextSelection) {
    const text = new RichText();
    selection.section = this.parseSection(selection.section);
    selection.section_offset = this.parseSection(selection.section_offset);
    for (let i = selection.section; i < selection.section_offset; i++) {
      const section = this.value.at(i);
      if (!section) continue;
      const start = i === selection.section ? section.parseCharacter(selection.character) : 0;
      const end = i === selection.section ? section.parseCharacter(selection.character_offset) : section.length;
      text.value.push(new RichTextSection(section.value.slice(start, end)));
    }
    return text;
  }
  
  public getSection(id: number | string | undefined): RichTextSection {
    let value: RichTextSection | undefined;
    
    if (typeof id === "string") {
      value = this.value.find(section => section.id === id);
      if (!value) throw new Error(`Could not find section with ID: '${id}'.`);
    }
    else if (typeof id === "number") {
      value = this.value.at(id);
      if (!value) throw new Error(`Could not find section at index '${id}'.`);
    }
    else {
      throw new Error(`Could not find section - Incompatible key given: '${id}'.`);
    }
    
    return value;
  }
  
  public getContent(selection?: RichTextSelection) {
    const fragment_list = [];
    for (let i = 0; i < this.value.length; i++) {
      const item = this.value.at(i);
      if (!item) continue;
      if (selection && selection.section <= i && selection.section_offset > i) {
        const start_character = selection.section === i ? selection.character : 0;
        const end_character = selection.section_offset === i ? selection.character : item.length;
        fragment_list.push(item.getFragmentList({character: start_character, character_offset: end_character}));
      }
      else {
        fragment_list.push(item.getFragmentList());
      }
      
    }
    return fragment_list;
  }
  
  public hasDecoration(property: keyof Initializer<Decoration>, selection: RichTextSelection) {
    // TODO: FIX
    // for (let i = selection.section; i < selection.section_offset; i++) {
    //   const start_character = i === selection.section ? selection.character : 0;
    //   const end_character = i === selection.section_offset ? selection.character_offset : this.getSection(selection.section_offset).length;
    //   for (let j = start_character; j < end_character; j++) {
    //     if (!this.at(i, j)?.decoration[property]) {
    //       return false;
    //     }
    //   }
    // }
    return true;
  }
  
  public parseSection(section: number) {
    return section < 0 ? Math.max(0, this.length + section) : section;
  }
  
  public insertCharacter<S extends Pick<RichTextSelection, "section" | "character">>(value: RichTextCharacter, selection: S): S {
    selection = this.ensureSection(selection);
    return this.getSection(selection.section).insert(value, selection);
  }
  
  public insertSection<S extends Pick<RichTextSelection, "section" | "character">>(value: RichTextSection | RichTextSection[], selection: S): S {
    selection = this.ensureSection(selection);
    const section = this.getSection(selection.section);
    if (selection.character) {
      section.ensureCharacter(selection);
    }
    
    value = Array.isArray(value) ? value : [value];
    for (let i = 0; i < value.length; i++) {
      const item = value.at(i);
      if (!item) continue;
      if (selection.character === section.length) {
        this.value.splice(++selection.section, 0, item);
        selection.character = item.length;
      }
      else {
        const section_overflow = section.value.splice(selection.character, section.length - selection.character);
        selection.character = item.length;
        item.insert(section_overflow, selection);
        this.value.splice(++selection.section, 0, item);
      }
    }
    
    return selection;
  }
  
  public remove<S extends RichTextSelection>(selection: S): S {
    if (selection.section > selection.section_offset) return selection;
    
    const start = this.value.at(selection.section);
    if (selection.section === selection.section_offset) {
      if (!start || selection.character > selection.character_offset) return selection;
      return {...selection, ...start.remove(selection)};
    }
    
    const end = this.value.at(selection.section_offset);
    for (let i = 0; i < this.value.length; i++) {
      if (i >= selection.section || i <= selection.section_offset) {
        this.value.splice(i--, 1);
      }
    }
    
    if (start && end) {
      this.value.splice(selection.section, 0, new RichTextSection([...start.value.slice(0, selection.character), ...end.value.slice(selection.character_offset)]));
    }
    else if (start) {
      this.value.splice(selection.section, 0, new RichTextSection(start.value.slice(0, selection.character)));
    }
    else if (end) {
      this.value.splice(selection.section, 0, new RichTextSection(end.value.slice(selection.character_offset)));
    }
    
    return {...selection, section_offset: selection.section, character_offset: selection.character};
  }
  
  public replace<S extends RichTextSelection>(insert: RichTextCharacter | RichTextSection | (RichTextCharacter | RichTextSection)[], selection: S): S {
    if (selection.section !== selection.section_offset || selection.character !== selection.character_offset) {
      selection = this.remove(selection);
    }
    
    if (insert instanceof RichTextCharacter) {
      selection = this.insertCharacter(insert, selection);
    }
    else if (insert instanceof RichTextSection) {
      selection = this.insertSection(insert, selection);
    }
    else if (Array.isArray(insert)) {
      for (let i = 0; i < insert.length; i++) {
        const item = insert.at(i);
        if (item instanceof RichTextCharacter) {
          selection = this.insertCharacter(item, selection);
        }
        else if (item instanceof RichTextSection) {
          selection = this.insertSection(item, selection);
        }
      }
    }
    
    selection.section_offset = selection.section;
    selection.character_offset = selection.character;
    
    return selection;
  }
  
  public decorate<S extends RichTextSelection>(decoration: Initializer<Decoration>, selection: S): S {
    for (let i = selection.section; i < selection.section_offset; i++) {
      const section = this.value.at(i);
      if (!section) continue;
      if (i === selection.section || i === selection.section_offset) {
        const start_character = i === selection.section ? selection.section : 0;
        const end_character = i === selection.section_offset ? selection.section_offset : section.length;
        section.decorate(decoration, {character: start_character, character_offset: end_character});
      }
      else {
        section.decorate(decoration, {character: 0, character_offset: section.length});
      }
    }
    
    return selection;
  }
  
  public ensureSection<S extends Pick<RichTextSelection, "section">>(selection: S): S {
    selection = {...selection, section: this.parseSection(selection.section)};
    
    if (this.value.length <= selection.section) {
      for (let i = 0; i <= selection.section; i++) {
        if (!this.value.at(i)) {
          this.value[i] = new RichTextSection();
        }
      }
    }
    
    return selection;
  }
  
  public clone() {
    return new RichText(this.value.map(section => section.clone()));
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


export interface RichTextSelection extends RichTextSectionSelection {
  section: number;
  section_offset: number;
}
