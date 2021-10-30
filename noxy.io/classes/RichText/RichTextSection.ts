import {v4} from "uuid";
import Util from "../../../common/services/Util";
import RichTextCharacter, {RichTextCharacterContent} from "./RichTextCharacter";
import RichTextDecoration from "./RichTextDecoration";


export default class RichTextSection {
  
  public readonly id: string;
  public readonly character_list: RichTextCharacter[];
  public readonly element: (keyof HTMLElementTagNameMap)[];
  
  public get length() {
    return this.character_list.length;
  }
  
  public get text() {
    return this.character_list.map(character => character.value).join("");
  }
  
  constructor(initializer: RichTextSectionInitializer = {}) {
    this.id = v4();
    this.element = Array.isArray(initializer.element) ? initializer.element : [initializer.element ?? "p"];
    if (typeof initializer.character_list === "string") {
      this.character_list = RichTextCharacter.parseText(initializer.character_list);
    }
    else if (Array.isArray(initializer.character_list)) {
      this.character_list = [];
      for (let i = 0; i < initializer.character_list.length; i++) {
        const item = initializer.character_list.at(i);
        if (!item) continue;
        if (item instanceof RichTextCharacter) {
          this.character_list.push(item);
        }
        else {
          this.character_list.push(...RichTextCharacter.parseContent(item));
        }
      }
    }
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
      this.character_list[i] = new RichTextCharacter({value: character.value, decoration: {...character.decoration, ...decoration}});
    }
    
    return selection;
  }
  
  public ensureCharacter<S extends Pick<RichTextSectionSelection, "character">>(selection: S): S {
    selection = {...selection, character: selection.character < 0 ? Math.max(0, this.length + selection.character) : selection.character};
    
    if (selection.character >= this.length) {
      if (selection.character > 0 && !this.character_list.at(0)) {
        this.character_list[0] = new RichTextCharacter({value: RichTextCharacter.space});
      }
      
      for (let i = 1; i < selection.character; i++) {
        if (this.character_list.at(i)) continue;
        this.character_list[i] = new RichTextCharacter({value: RichTextCharacter.space, decoration: this.getCharacter(i - 1).decoration});
      }
    }
    
    return selection;
  }
  
  public clone() {
    return new RichTextSection({
      character_list: this.character_list,
      element:        this.element,
    });
  }
  
  public static parseText(text?: string | string[], element?: HTMLTag | HTMLTag[]): RichTextSection[] {
    const value = [] as RichTextSection[];
    
    if (typeof text === "string") {
      value.push(new RichTextSection({character_list: RichTextCharacter.parseText(text), element}));
    }
    
    if (Array.isArray(text)) {
      for (let i = 0; i < text.length; i++) {
        const item = text.at(i);
        if (item) value.push(new RichTextSection({character_list: RichTextCharacter.parseText(item), element}));
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
        if (item) value.push(new RichTextSection({character_list: RichTextCharacter.parseHTML(item)}));
      }
      return value;
    }
    
    return [];
  }
  
}

export interface RichTextSectionInitializer {
  readonly element?: HTMLTag | HTMLTag[];
  readonly character_list?: string | RichTextCharacter[] | RichTextCharacterContent[];
}

export type RichTextSectionContent = {
  readonly  element: HTMLTag[]
  readonly character_list: RichTextCharacterContent[]
}

export interface RichTextSectionSelection {
  character: number;
  character_offset: number;
}
