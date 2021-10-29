import {v4} from "uuid";
import Util from "../../../common/services/Util";
import RichTextCharacter, {RichTextCharacterContent, RichTextCharacterValueInit} from "./RichTextCharacter";
import RichTextDecoration from "./RichTextDecoration";


export default class RichTextSection {
  
  public readonly id: string;
  public readonly character_list: RichTextCharacter[];
  public readonly element: (keyof HTMLElementTagNameMap)[];
  
  constructor(initializer: RichTextSection | RichTextSectionContent | {character_list?: RichTextCharacterValueInit, element?: HTMLTag | HTMLTag[]} = {}) {
    this.id = v4();
    this.element = Array.isArray(initializer.element) ? initializer.element : [initializer.element ?? "p"];

    if (initializer instanceof RichTextSection) {
      this.character_list = initializer.character_list;
    }
    if (initializer.character_list)
    this.character_list = RichTextCharacter.parseText(initializer.character_list);
  }
  
  public get length() {
    return this.character_list.length;
  }
  
  public get text() {
    return this.character_list.map(character => character.value).join("");
  }
  
  public toObject(selection?: RichTextSectionSelection): RichTextSectionContent {
    const content = {character_list: [], element: this.element} as RichTextSectionContent;
    if (!this.length) return content;
    
    content.character_list.push({start: 0, end: 0, index: 0, fragment_list: [{text: "", decoration: new RichTextDecoration().toObject(), start: 0, end: 0}]});
    for (let i = 0; i < this.length; i++) {
      const line = content.character_list.at(-1);
      const character = this.getCharacter(i);
      const decoration = {...character.decoration.toObject(), selected: !!selection && selection.character <= i && selection.character_offset > i};
      
      if (line && character.value !== RichTextCharacter.linebreak) {
        const fragment = line.fragment_list.at(-1);
        
        if (fragment && Util.getProperties(fragment.decoration).every(key => fragment.decoration[key] === decoration[key])) {
          line.end = i;
          fragment.end = i;
          fragment.text += character.value;
        }
        else {
          line.fragment_list.push({start: i, end: i, text: character.value, decoration});
        }
      }
      else {
        const text = character.value !== RichTextCharacter.linebreak ? character.value : "";
        const start = i + 1, end = start;
        content.character_list.push({start, end, index: content.character_list.length, fragment_list: [{start, end, text, decoration}]});
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
  
  public parseCharacter(character: number): number {
    return character < 0 ? Math.max(0, this.length + character) : character;
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
    for (let i = selection.character; i <= selection.character_offset; i++) {
      const character = this.character_list.at(i);
      if (!character) continue;
      this.character_list[i] = new RichTextCharacter(character.value, {...character.decoration, ...decoration});
    }
    
    return selection;
  }
  
  public ensureCharacter<S extends Pick<RichTextSectionSelection, "character">>(selection: S): S {
    selection = {...selection, character: selection.character < 0 ? Math.max(0, this.length + selection.character) : selection.character};
    
    if (selection.character >= this.length) {
      if (selection.character > 0 && !this.character_list.at(0)) {
        this.character_list[0] = new RichTextCharacter(RichTextCharacter.space);
      }
      
      for (let i = 1; i < selection.character; i++) {
        if (this.character_list.at(i)) continue;
        this.character_list[i] = new RichTextCharacter(RichTextCharacter.space, this.getCharacter(i - 1).decoration);
      }
    }
    
    return selection;
  }
  
  public clone() {
    return new RichTextSection({
      value:   this.character_list,
      element: this.element,
    });
  }
  
  public static parseText(text?: RichTextSectionValueInit) {
    const value = [] as RichTextSection[];
    if (!text) return value;
    
    text = Array.isArray(text) ? text : [text];
    for (let i = 0; i < text.length; i++) {
      const item = text.at(i);
      if (item instanceof RichTextSection) {
        value.push(item);
      }
      else if (typeof item === "string") {
        value.push(new RichTextSection({value: RichTextCharacter.parseText(item)}));
      }
    }
    
    return value;
  }
  
  public static parseHTML(node: Node): RichTextSection[] {
    if (node instanceof HTMLBRElement) {
      return [new RichTextSection(), new RichTextSection()];
    }
    
    if (node instanceof Text) {
      return this.parseText(node.data);
    }
    
    if (node instanceof HTMLElement) {
      const value = [] as RichTextSection[];
      for (let i = 0; i < node.children.length; i++) {
        const item = node.childNodes.item(i);
        if (item) value.push(new RichTextSection({value: RichTextCharacter.parseHTML(item)}));
      }
      return value;
    }
    
    return [];
  }
  
}

export interface RichTextSectionInitializer {

}

export type RichTextSectionValueInit = RichTextSection | string | (RichTextSection | string)[]

export interface RichTextSectionSelection {
  character: number;
  character_offset: number;
}

export type RichTextSectionContent = {
  element: HTMLTag[]
  character_list: RichTextCharacterContent[]
}
