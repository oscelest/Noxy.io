import {v4} from "uuid";
import Alignment from "../../../common/enums/Alignment";
import RichTextCharacter from "./RichTextCharacter";
import RichTextDecoration, {RichTextDecorationKeys} from "./RichTextDecoration";
import RichTextSection, {RichTextSectionContent, RichTextSectionSelection} from "./RichTextSection";

export default class RichText {

  public readonly id: string;
  public readonly section_list: RichTextSection[];
  public readonly element: HTMLTag;
  public readonly alignment: Alignment;

  public get text() {
    return this.section_list.map(section => section.text);
  }

  public get size() {
    return this.section_list.reduce((result, section) => result + section.length, 0);
  }

  public get length() {
    return this.section_list.length;
  }

  constructor(initializer: RichTextInitializer = {}) {
    this.id = initializer.id ?? v4();
    this.element = initializer.element ?? "div";
    this.section_list = [];
    this.alignment = initializer.alignment ?? Alignment.LEFT;

    if (!initializer.section_list) {
      this.section_list.push(new RichTextSection());
    }
    else if (typeof initializer.section_list === "string") {
      this.section_list.push(...RichTextSection.parseText(initializer.section_list));
    }
    else if (Array.isArray(initializer.section_list)) {
      for (let i = 0; i < initializer.section_list.length; i++) {
        const item = initializer.section_list.at(i);
        if (!item) continue;
        if (typeof item === "string") {
          this.section_list.push(...RichTextSection.parseText(item));
        }
        else if (item instanceof RichTextSection) {
          this.section_list.push(item);
        }
        else {
          this.section_list.push(new RichTextSection({character_list: item.character_list, element: item.element}));
        }
      }
    }
  }

  public toObject(selection?: RichTextSelection): RichTextObject {
    const content = {id: this.id, section_list: [], element: this.element, alignment: this.alignment} as RichTextObject;

    for (let i = 0; i < this.section_list.length; i++) {
      const section = this.section_list.at(i);
      if (!section) continue;

      if (selection && selection.section <= i && selection.section_offset >= i) {
        const start_character = selection.section === i ? selection.character : 0;
        const end_character = selection.section_offset === i ? selection.character_offset : section.length;
        content.section_list.push(section.toObject({character: start_character, character_offset: end_character}));
      }
      else {
        content.section_list.push(section.toObject());
      }
    }

    return content;
  }

  public clone() {
    return new RichText({
      id:           this.id,
      element:      this.element,
      section_list: this.section_list.map(section => section.clone()),
      alignment:    this.alignment,
    });
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

  public parseSectionPosition(section: number) {
    return section < 0 ? Math.max(0, this.length + section) : section;
  }

  public hasDecoration(property: RichTextDecorationKeys, {section, section_offset, character, character_offset}: RichTextSelection, flag_all: boolean = true) {
    section = this.parseSectionPosition(section);
    section_offset = this.parseSectionPosition(section_offset);

    for (let i = section; i <= section_offset; i++) {
      const current_section = this.getSection(i);
      const start_character = i === section ? character : 0;
      const end_character = i === section_offset ? character_offset : current_section.length;
      const decoration = current_section.hasDecoration(property, {character: start_character, character_offset: end_character}, flag_all);

      if (!decoration && flag_all) {
        return false;
      }

      if (decoration && !flag_all) {
        return true;
      }
    }

    return flag_all;
  }

  public getDecoration(selection: RichTextSelection): RichTextDecoration | undefined {
    const section = this.parseSectionPosition(selection.section);
    const section_offset = this.parseSectionPosition(selection.section_offset);

    if (section === section_offset) {
      return this.getSection(section).getDecoration(selection);
    }

    const decoration_list = [];
    for (let i = section; i <= section_offset; i++) {
      const current_section = this.getSection(i);
      const start_character = i === section ? current_section.parseCharacterPosition(selection.character) : 0;
      const end_character = i === section_offset ? current_section.parseCharacterPosition(selection.character_offset) : current_section.length;

      const decoration = current_section.getDecoration({character: start_character, character_offset: end_character});
      if (decoration) {
        decoration_list.push(decoration);
      }
    }

    return decoration_list.length ? RichTextDecoration.getUnion(...decoration_list) : undefined;
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

    // Assign start as we will use it to check if start and end section is the same
    const section_start = this.section_list.at(selection.section);
    if (selection.section === selection.section_offset) {
      // If section doesn't exist or start character is greater than end character, exit.
      if (!section_start || selection.character > selection.character_offset) return selection;
      // Else remove characters from section
      return {...selection, ...section_start.remove(selection)};
    }

    const section_end = this.section_list.at(selection.section_offset);
    const section_value = section_start ?? section_end ?? new RichTextSection();
    const char_start = section_start?.character_list.slice(0, selection.character) ?? [];
    const char_end = section_end?.character_list.slice(selection.character_offset) ?? [];

    section_value.character_list.splice(0, section_value.character_list.length, ...char_start, ...char_end);
    this.section_list.splice(0, this.length, ...this.section_list.slice(0, selection.section), section_value, ...this.section_list.slice(selection.section_offset + 1));

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
    selection.section = this.parseSectionPosition(selection.section);
    selection.section_offset = this.parseSectionPosition(selection.section_offset);

    for (let i = selection.section; i <= selection.section_offset; i++) {
      const current_section = this.getSection(i);
      if (!current_section) continue;
      if (i === selection.section || i === selection.section_offset) {
        const character = i === selection.section ? selection.character : 0;
        const character_offset = i === selection.section_offset ? selection.character_offset : -1;
        return current_section.decorate(decoration, {...selection, character, character_offset});
      }
      else {
        return current_section.decorate(decoration, {...selection, character: 0, character_offset: -1});
      }
    }

    return selection;
  }

  public slice({section, section_offset, character, character_offset}: RichTextSelection) {
    const section_list = [] as RichTextSection[];
    section = this.parseSectionPosition(section);
    section_offset = this.parseSectionPosition(section_offset);

    for (let i = section; i <= section_offset; i++) {
      const current_section = this.section_list.at(i);
      if (!current_section) continue;
      const start = i === section ? character : 0;
      const end = i === section_offset ? character_offset : current_section.length;
      section_list.push(current_section.slice({character: start, character_offset: end}));
    }

    return new RichText({element: this.element, section_list});
  }

  public ensureSection<S extends Pick<RichTextSelection, "section">>(selection: S): S {
    selection = {...selection, section: this.parseSectionPosition(selection.section)};

    if (this.section_list.length <= selection.section) {
      for (let i = 0; i <= selection.section; i++) {
        if (!this.section_list.at(i)) {
          this.section_list[i] = new RichTextSection();
        }
      }
    }

    return selection;
  }

  public static parseObject(content?: RichText | RichTextObject) {
    return new RichText(content);
  }

  public static parseHTML(node: HTMLElement) {
    return new RichText({section_list: RichTextSection.parseHTML(node)});
  }
}

export interface RichTextInitializer {
  id?: string;
  element?: HTMLTag;
  section_list?: string | string[] | RichTextSection[] | RichTextSectionContent[];
  alignment?: Alignment;
}

export interface RichTextObject {
  readonly id: string;
  readonly element: HTMLTag;
  readonly section_list: RichTextSectionContent[];
  readonly alignment: Alignment;
}

export interface RichTextSelection extends RichTextSectionSelection {
  section: number;
  section_offset: number;
}
