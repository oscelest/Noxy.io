import {v4} from "uuid";
import Util from "../../../common/services/Util";
import RichTextCharacter, {RichTextCharacterContent} from "./RichTextCharacter";
import RichTextDecoration, {RichTextDecorationObject, RichTextDecorationKeys} from "./RichTextDecoration";
import FatalException from "../../exceptions/FatalException";

export default class RichTextSection {

  public readonly id: string;
  public readonly character_list: RichTextCharacter[];
  public readonly element: (keyof HTMLElementTagNameMap)[];

  private static readonly default_element = "p";

  public get length() {
    return this.character_list.length;
  }

  public get text() {
    return this.character_list.map(character => character.value).join("");
  }

  constructor(initializer: RichTextSectionInitializer = {}) {
    this.id = initializer.id ?? v4();
    this.element = Array.isArray(initializer.element) ? initializer.element : [initializer.element || RichTextSection.default_element];
    this.character_list = RichTextSection.sanitizeCharacterList(initializer.character_list);
  }

  public toObject(selection?: RichTextSectionSelection): RichTextSectionContent {
    const content = {id: this.id, character_list: [], element: this.element} as RichTextSectionContent;
    if (!this.length) return content;

    content.character_list.push({start: 0, end: 0, index: 0, fragment_list: []});
    for (let i = 0; i < this.length; i++) {
      const line = content.character_list.at(-1);
      if (!line) throw new Error("Line should always exist.");

      const character = this.getCharacter(i);
      const decoration = character.decoration as RichTextDecorationObject;

      if (character.value !== RichTextCharacter.linebreak) {
        const fragment = line.fragment_list.at(-1);
        decoration.selected = !!selection && selection.character <= i && selection.character_offset > i;

        if (fragment && fragment.text === "") {
          line.end = i;
          fragment.end = i;
          fragment.text = character.value;
          fragment.decoration = decoration;
        }
        else if (fragment && Util.getProperties(fragment.decoration).every(key => fragment.decoration[key] === decoration[key])) {
          line.end = i;
          fragment.end = i;
          fragment.text += character.value;
        }
        else {
          line.fragment_list.push({start: i, end: i, text: character.value, decoration});
        }
      }
      else {
        if (!line.fragment_list.length) {
          line.fragment_list.push({text: "", decoration, start: i, end: i});
        }
        content.character_list.push({start: i, end: i, index: content.character_list.length, fragment_list: [{start: i, end: i, text: "", decoration}]});
      }
    }

    return content;
  }

  public getCharacter(id?: number | string): RichTextCharacter {
    let value: RichTextCharacter | undefined;

    if (typeof id === "string") {
      value = this.character_list.find(section => section.id === id);
      if (!value) throw new Error(`Could not find character with ID: '${id}'.`);
    }
    else if (typeof id === "number") {
      value = this.character_list.at(id);
      if (!value) throw new Error(`Could not find character at index '${id}'.`);
    }
    else {
      throw new Error(`Could not find character - Incompatible key given: '${id}'.`);
    }

    return value;
  }

  public parseCharacterPosition(character: number): number {
    return character < 0 ? Math.max(0, this.length + character) : character;
  }

  public ensureCharacter<S extends Pick<RichTextSectionSelection, "character">>(selection: S): S {
    selection = {...selection, character: selection.character < 0 ? Math.max(0, this.length + selection.character) : selection.character};

    if (selection.character >= this.length) {
      for (let i = 0; i < selection.character; i++) {
        if (this.character_list.at(i)) continue;
        this.character_list[i] = new RichTextCharacter({value: RichTextCharacter.space});
      }
    }

    return selection;
  }

  public hasDecoration(property: RichTextDecorationKeys, {character, character_offset}: RichTextSectionSelection, flag_all: boolean = true): boolean {
    character = this.parseCharacterPosition(character);
    character_offset = this.parseCharacterPosition(character_offset);

    for (let i = character; i < character_offset; i++) {
      const decoration = this.getCharacter(i).decoration[property];
      if (!decoration && flag_all) {
        return false;
      }

      if (decoration && !flag_all) {
        return true;
      }
    }

    return flag_all;
  }

  public getDecoration(selection: RichTextSectionSelection): RichTextDecoration | undefined {
    const character = this.parseCharacterPosition(selection.character);
    const character_offset = this.parseCharacterPosition(selection.character_offset);

    if (character === character_offset) {
      if (character === 0) {
        return undefined;
      }
      return this.character_list.at(character - 1)?.decoration;
    }

    const decoration_list = [];
    for (let i = character; i < character_offset; i++) {
      decoration_list.push(this.getCharacter(i).decoration.toObject());
    }

    return decoration_list.length ? RichTextDecoration.getUnion(...decoration_list) : undefined;
  }


  public insert<S extends Pick<RichTextSectionSelection, "character">>(insert: RichTextCharacter | RichTextCharacter[], selection: S): S {
    if (selection.character) selection = this.ensureCharacter(selection);

    if (Array.isArray(insert)) {
      this.character_list.splice(selection.character, 0, ...insert);
      selection.character += insert.length;
    }
    else {
      this.character_list.splice(selection.character, 0, insert);
      selection.character++;
    }

    return selection;
  }

  public remove<S extends RichTextSectionSelection>(selection: S): S {
    if (selection.character >= selection.character_offset) return selection;
    this.character_list.splice(selection.character, selection.character_offset - selection.character);
    return {...selection, character: selection.character, character_offset: selection.character};
  }

  public decorate<S extends RichTextSectionSelection>(decoration: Initializer<RichTextDecoration>, selection: S): S {
    selection.character = this.parseCharacterPosition(selection.character);
    selection.character_offset = this.parseCharacterPosition(selection.character_offset);

    for (let i = selection.character; i < selection.character_offset; i++) {
      const character = this.character_list.at(i);
      if (!character) continue;
      this.character_list[i] = new RichTextCharacter({value: character.value, decoration: new RichTextDecoration(character.decoration, decoration)});
    }

    return selection;
  }

  public findCharacter(pattern: RegExp, start: number, forward: boolean = true) {
    if (forward) {
      for (let index = start; index < this.length; index++) {
        const character = this.getCharacter(index);
        if (character.value.match(pattern)) {
          return {character, index};
        }
      }
    }
    else {
      for (let index = start - 1; index >= 0; index--) {
        const character = this.getCharacter(index);
        if (character.value.match(pattern)) {
          return {character, index};
        }
      }
    }
  }

  public clone() {
    return new RichTextSection({
      id:             this.id,
      element:        this.element,
      character_list: this.character_list.map(char => char.clone()),
    });
  }

  public slice({character, character_offset}: RichTextSectionSelection) {
    return new RichTextSection({
      element:        this.element,
      character_list: this.character_list.slice(this.parseCharacterPosition(character), this.parseCharacterPosition(character_offset)),
    });
  }

  public static parseHTML(element: HTMLElement, decoration?: RichTextDecoration): RichTextSection[] {
    const value = [] as RichTextSection[];
    const node = element instanceof HTMLTemplateElement ? element.content : element;

    for (let i = 0; i < node.childNodes.length; i++) {
      const item = node.childNodes.item(i);
      if (!item || item instanceof HTMLBRElement || !(item instanceof Text) && item.childNodes.length === 0) continue;

      if (item instanceof Text) {
        value.push(new RichTextSection({character_list: RichTextCharacter.parseText(item.data, RichTextDecoration.parseHTML(element, decoration))}));
      }
      else if (item instanceof HTMLElement) {
        if (node.textContent === item.textContent) {
          value.push(...RichTextSection.parseHTML(item, decoration));
        }
        else {
          value.push(new RichTextSection({character_list: RichTextCharacter.parseHTML(item, decoration)}));
        }
      }
    }

    return value;
  }

  public static sanitize(section?: string | RichTextSection | RichTextSectionContent, fn?: RichTextSectionElementFn) {
    const element = (typeof fn === "function" ? fn(section) : fn) || RichTextSection.default_element;

    if (section instanceof RichTextSection || typeof section === "object") {
      return new RichTextSection({...section, element});
    }
    else if (typeof section === "string") {
      return new RichTextSection({character_list: RichTextCharacter.parseText(section), element});
    }
    else {
      throw new FatalException("Could not parse given RichTextSection.");
    }
  }

  public static sanitizeCharacterList(initializer?: RichTextCharacterListInitializer) {
    const section_list = [] as RichTextCharacter[];

    if (Array.isArray(initializer)) {
      for (let i = 0; i < initializer.length; i++) {
        const character = initializer[i];
        if (character) section_list.push(...this.sanitizeCharacterList(character));
      }
    }
    else if (initializer instanceof RichTextCharacter || typeof initializer === "string") {
      section_list.push(RichTextCharacter.sanitize(initializer));
    }
    else if (typeof initializer === "object" && initializer.fragment_list?.length) {
      for (let i = 0; i < initializer.fragment_list.length; i++) {
        const fragment = initializer.fragment_list.at(i);
        if (!fragment) continue;
        for (let j = 0; j < fragment.text?.length; j++) {
          const character = fragment.text.at(i);
          if (!character) continue;
          section_list.push(RichTextCharacter.sanitize({value: character, decoration: fragment.decoration}));
        }
      }
    }


    return section_list;
  }

}

export type RichTextSectionElementFn = HTMLTag | HTMLTag[] | ((object?: string | RichTextSection | RichTextSectionInitializer) => HTMLTag | HTMLTag[])

export type RichTextCharacterListInitializer = string | RichTextCharacter | RichTextCharacterContent | (string | RichTextCharacter | RichTextCharacterContent)[];


export interface RichTextSectionInitializer {
  id?: string;
  element?: HTMLTag | HTMLTag[];
  character_list?: RichTextCharacterListInitializer;
}

export type RichTextSectionContent = {
  readonly id: string;
  readonly element: HTMLTag[]
  readonly character_list: RichTextCharacterContent[]
}

export interface RichTextSectionSelection {
  character: number;
  character_offset: number;
}
