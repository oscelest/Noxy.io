import {v4} from "uuid";
import RichTextCharacter from "./RichTextCharacter";
import RichTextDecoration from "./RichTextDecoration";
import RichTextSection, {RichTextSectionContent, RichTextSectionSelection, RichTextSectionValueInit} from "./RichTextSection";

export default class RichText {
  
  public readonly id: string;
  public readonly section_list: RichTextSection[];
  public readonly element: HTMLTag;
  
  constructor(initializer: {value?: RichTextSectionValueInit, element?: HTMLTag} = {}) {
    this.id = v4();
    this.section_list = RichTextSection.parseText(initializer.value);
    this.element = initializer.element ?? "div";
  }
  
  public get text() {
    return this.section_list.map(section => section.text);
  }
  
  public get size() {
    return this.section_list.reduce((result, section) => result + section.length, 0);
  }
  
  public get length() {
    return this.section_list.length;
  }
  
  public toObject(selection?: RichTextSelection): RichTextContent {
    const content = {section_list: [], element: this.element} as RichTextContent;
    for (let i = 0; i < this.section_list.length; i++) {
      const section = this.section_list.at(i);
      if (!section) continue;
      if (selection && selection.section <= i && selection.section_offset > i) {
        const start_character = selection.section === i ? selection.character : 0;
        const end_character = selection.section_offset === i ? selection.character : section.length;
        content.section_list.push(section.toObject({character: start_character, character_offset: end_character}));
      }
      else {
        content.section_list.push(section.toObject());
      }
    }
    return content;
  }
  
  public slice({...selection}: RichTextSelection) {
    const text = new RichText();
    selection.section = this.parseSection(selection.section);
    selection.section_offset = this.parseSection(selection.section_offset);
    for (let i = selection.section; i < selection.section_offset; i++) {
      const section = this.section_list.at(i);
      if (!section) continue;
      const start = i === selection.section ? section.parseCharacter(selection.character) : 0;
      const end = i === selection.section ? section.parseCharacter(selection.character_offset) : section.length;
      text.section_list.push(new RichTextSection({value: section.character_list.slice(start, end)}));
    }
    return text;
  }
  
  public getSection(id: number | string | undefined): RichTextSection {
    let value: RichTextSection | undefined;
    
    if (typeof id === "string") {
      value = this.section_list.find(section => section.id === id);
      if (!value) throw new Error(`Could not find section with ID: '${id}'.`);
    }
    else if (typeof id === "number") {
      value = this.section_list.at(id);
      if (!value) throw new Error(`Could not find section at index '${id}'.`);
    }
    else {
      throw new Error(`Could not find section - Incompatible key given: '${id}'.`);
    }
    
    return value;
  }
  
  
  public hasDecoration(property: keyof Initializer<RichTextDecoration>, selection: RichTextSelection) {
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
        this.section_list.splice(++selection.section, 0, item);
        selection.character = item.length;
      }
      else {
        const section_overflow = section.character_list.splice(selection.character, section.length - selection.character);
        selection.character = item.length;
        item.character_list.splice(selection.character, 0, ...section_overflow);
        this.section_list.splice(++selection.section, 0, item);
      }
    }
    
    return selection;
  }
  
  public remove<S extends RichTextSelection>(selection: S): S {
    if (selection.section > selection.section_offset) return selection;
    
    const start = this.section_list.at(selection.section);
    if (selection.section === selection.section_offset) {
      if (!start || selection.character > selection.character_offset) return selection;
      return {...selection, ...start.remove(selection)};
    }
    
    const end = this.section_list.at(selection.section_offset);
    for (let i = 0; i < this.section_list.length; i++) {
      if (i >= selection.section || i <= selection.section_offset) {
        this.section_list.splice(i--, 1);
      }
    }
    
    if (start && end) {
      this.section_list.splice(selection.section, 0, new RichTextSection({value: [...start.character_list.slice(0, selection.character), ...end.character_list.slice(selection.character_offset)]}));
    }
    else if (start) {
      this.section_list.splice(selection.section, 0, new RichTextSection({value: start.character_list.slice(0, selection.character)}));
    }
    else if (end) {
      this.section_list.splice(selection.section, 0, new RichTextSection({value: end.character_list.slice(selection.character_offset)}));
    }
    
    return {...selection, section_offset: selection.section, character_offset: selection.character};
  }
  
  public replace<S extends RichTextSelection>(insert: RichTextCharacter | RichTextSection | (RichTextCharacter | RichTextSection)[], selection: S): S {
    if (selection.section !== selection.section_offset || selection.character !== selection.character_offset) {
      selection = this.remove(selection);
    }
    
    insert = Array.isArray(insert) ? insert : [insert];
    for (let i = 0; i < insert.length; i++) {
      const item = insert.at(i);
      if (item instanceof RichTextCharacter) {
        selection = this.insertCharacter(item, selection);
      }
      else if (item instanceof RichTextSection) {
        selection = this.insertSection(item, selection);
      }
    }
    
    selection.section_offset = selection.section;
    selection.character_offset = selection.character;
    
    return selection;
  }
  
  public decorate<S extends RichTextSelection>(decoration: Initializer<RichTextDecoration>, selection: S): S {
    for (let i = selection.section; i < selection.section_offset; i++) {
      const section = this.section_list.at(i);
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
    
    if (this.section_list.length <= selection.section) {
      for (let i = 0; i <= selection.section; i++) {
        if (!this.section_list.at(i)) {
          this.section_list[i] = new RichTextSection();
        }
      }
    }
    
    return selection;
  }
  
  public clone() {
    return new RichText({
      value:   this.section_list.map(section => section.clone()),
      element: this.element,
    });
  }
  
  public static parseHTML(node: string | HTMLElement) {
    if (node instanceof HTMLElement) {
      return new RichText({value: RichTextSection.parseHTML(node)});
    }
    
    const element = document.createElement("template");
    element.innerHTML = node;
    
    return new RichText({value: RichTextSection.parseHTML(element.content)});
  }
  
}

export interface RichTextContent {
  readonly element: HTMLTag;
  readonly section_list: RichTextSectionContent[];
}

export interface RichTextSelection extends RichTextSectionSelection {
  section: number;
  section_offset: number;
}
