import {v4} from "uuid";
import Util from "../../../common/services/Util";
import Character from "../Character";
import Decoration, {DecorationObject} from "../Decoration";
import RichTextCharacter, {RichTextCharacterValueInit} from "./RichTextCharacter";


export default class RichTextSection {
  
  public readonly id: string;
  public readonly value: RichTextCharacter[];
  public readonly decoration: (keyof HTMLElementTagNameMap)[];
  
  constructor(value?: RichTextCharacterValueInit, decoration: (keyof HTMLElementTagNameMap)[] = []) {
    this.id = v4();
    this.value = RichTextCharacter.parseText(value);
    this.decoration = decoration;
  }
  
  public get length() {
    return this.value.length;
  }
  
  public get text() {
    return this.value.map(character => character.value).join("");
  }
  
  public getCharacter(id?: number | string): RichTextCharacter {
    let value: RichTextCharacter | undefined;
    
    if (typeof id === "string") {
      value = this.value.find(section => section.id === id);
      if (!value) throw new Error(`Could not find character with ID: '${id}'.`);
    }
    else if (typeof id === "number") {
      value = this.value.at(id);
      if (!value) throw new Error(`Could not find character at index '${id}'.`);
    }
    else {
      throw new Error(`Could not find character - Incompatible key given: '${id}'.`);
    }
    
    return value;
  }
  
  public getFragmentList(selection?: RichTextSectionSelection) {
    const content = [] as RichTextSectionContent;
    if (!this.length) return content;
    
    content.push({start: 0, end: 0, index: 0, text: [{text: "", decoration: new Decoration().toObject(), start: 0, end: 0}]});
    for (let i = 0; i < this.length; i++) {
      const line = content.at(-1);
      const character = this.getCharacter(i);
      const decoration = {...character.decoration.toObject(), selected: !!selection && selection.character <= i && selection.character_offset > i};
      
      if (line && character.value !== Character.linebreak) {
        const fragment = line.text.at(-1);
        
        if (fragment && Util.getProperties(fragment.decoration).every(key => fragment.decoration[key] === decoration[key])) {
          line.end = i;
          fragment.end = i;
          fragment.text += character.value;
        }
        else {
          line.text.push({start: i, end: i, text: character.value, decoration});
        }
      }
      else {
        const text = character.value !== Character.linebreak ? character.value : "";
        const start = i + 1, end = start;
        content.push({start, end, index: content.length, text: [{start, end, text, decoration}]});
      }
    }
    
    return content;
  }
  
  public insert<S extends Pick<RichTextSectionSelection, "character">>(insert: RichTextCharacter | RichTextCharacter[], selection: S): S {
    if (selection.character) selection = this.ensureCharacter(selection);
    
    if (Array.isArray(insert)) {
      this.value.splice(selection.character, 0, ...insert);
      selection.character += insert.length;
    }
    else {
      this.value.splice(selection.character, 0, insert);
      selection.character++;
    }
    
    return selection;
  }
  
  public remove(selection: RichTextSectionSelection) {
    if (selection.character >= selection.character_offset) return selection;
    this.value.splice(selection.character, selection.character_offset - selection.character);
    return {character: selection.character, character_offset: selection.character};
  }
  
  public decorate<S extends RichTextSectionSelection>(decoration: Initializer<Decoration>, selection: S): S {
    for (let i = selection.character; i <= selection.character_offset; i++) {
      const character = this.value.at(i);
      if (!character) continue;
      this.value[i] = new RichTextCharacter(character.value, {...character.decoration, ...decoration});
    }
    
    return selection;
  }
  
  public ensureCharacter<S extends Pick<RichTextSectionSelection, "character">>(selection: S): S {
    selection = {...selection, character: selection.character < 0 ? Math.max(0, this.length + selection.character) : selection.character};
    
    if (selection.character >= this.length) {
      if (selection.character > 0 && !this.value.at(0)) {
        this.value[0] = new RichTextCharacter(RichTextCharacter.space);
      }
      
      for (let i = 1; i < selection.character; i++) {
        if (this.value.at(i)) continue;
        this.value[i] = new RichTextCharacter(RichTextCharacter.space, this.getCharacter(i - 1).decoration);
      }
    }
    
    return selection;
  }
  
  public clone() {
    return new RichTextSection(this.value);
  }
  
  public static parseText(text?: RichTextSectionValueInit) {
    const value = [] as RichTextSection[];
    
    if (text instanceof RichTextSection) {
      value.push(new RichTextSection(text.value));
    }
    else if (typeof text === "string") {
      value.push(new RichTextSection(RichTextCharacter.parseText(text)));
    }
    else if (Array.isArray(text)) {
      for (let i = 0; i < text.length; i++) {
        const item = text.at(i);
        if (item instanceof RichTextSection) {
          value.push(new RichTextSection(item.value));
        }
        else if (typeof item === "string") {
          value.push(new RichTextSection(RichTextCharacter.parseText(item)));
        }
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
        if (item) value.push(new RichTextSection(RichTextCharacter.parseHTML(item)));
      }
      return value;
    }
    
    return [];
  }
  
}

export type RichTextSectionValueInit = RichTextSection | string | (RichTextSection | string)[]

export interface RichTextSectionSelection {
  character: number;
  character_offset: number;
}

export type RichTextSectionContent = RichTextSectionContentLine[]

export interface RichTextSectionContentLine {
  text: RichTextSectionContentFragment[];
  index: number;
  start: number;
  end: number;
}

export interface RichTextSectionContentFragment {
  text: string;
  decoration: DecorationObject;
  start: number;
  end: number;
}
