import {v4} from "uuid";
import Util from "../../../common/services/Util";
import Decoration from "../Decoration";
import {RichTextFragment} from "../RichText";
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
  
  public splitAt(position: number) {
    return [new RichTextSection(this.value.slice(0, position)), new RichTextSection(this.value.slice(position))];
  }
  
  public getCharacter(id: number | string | undefined, safe: true): RichTextCharacter
  public getCharacter(id: number | string | undefined, safe?: false): RichTextCharacter | undefined
  public getCharacter(id: number | string | undefined, safe: boolean = false): RichTextCharacter | undefined {
    const value = typeof id === "string" ? this.value.find(section => section.id === id) : (typeof id === "number" ? this.value.at(id) : undefined);
    if (!value && safe) throw new Error("Could not find section");
    return value;
  }
  
  public getFragmentList(selection?: RichTextSectionSelection): RichTextFragment[] {
    const content = [] as RichTextFragment[];
    
    for (let i = 0; i < this.length; i++) {
      const fragment = content.at(-1);
      const character = this.getCharacter(i, true);
      const decoration = {...character.decoration.toObject(), selected: !!selection && selection.start_character <= i && selection.end_character > i};
      
      if (fragment && Util.getProperties(fragment.decoration).every(key => fragment.decoration[key] === decoration[key])) {
        fragment.text += character.value;
        fragment.end = i;
      }
      else {
        content.push({text: character.value, decoration, start: i, end: i});
      }
    }
    
    return content;
  }
  
  public remove(selection: RichTextSectionSelection) {
    return new RichTextSection([...this.value.slice(0, selection.start_character), ...this.value.slice(selection.end_character)]);
  }
  
  public decorate(decoration: Initializer<Decoration>, selection: RichTextSectionSelection) {
    const value = new RichTextSection(this.value);
    
    for (let i = selection.start_character; i <= selection.end_character; i++) {
      const character = value.getCharacter(i, true);
      value.value[i] = new RichTextCharacter(character.value, {...character.decoration, ...decoration});
    }
    
    return value;
  }
  
  public static parseText(text?: RichTextSectionValueInit): RichTextSection[] {
    if (text instanceof RichTextSection) {
      return [new RichTextSection(text.value)];
    }
    
    if (typeof text === "string") {
      return [new RichTextSection(RichTextCharacter.parseText(text))];
    }
    
    if (Array.isArray(text)) {
      const value = [] as RichTextSection[];
      for (let i = 0; i < text.length; i++) {
        const item = text.at(i);
        if (!item) continue;
        value.push(...this.parseText(item));
      }
      return value;
    }
    
    return [];
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
  start_character: number;
  end_character: number;
}
