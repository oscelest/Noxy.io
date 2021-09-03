import {v4} from "uuid";
import Util from "../../common/services/Util";
import Character from "./Character";
import Decoration from "./Decoration";

export default class RichText {
  
  public readonly id: string;
  
  private readonly value: Character[];
  
  public get length() {
    return this.value.length;
  };
  
  constructor(...text: (Character | Character[] | RichText)[]) {
    this.id = v4();
    this.value = [];
    for (let i = 0; i < text.length; i++) {
      const value = text[i];
      if (value instanceof Character) {
        this.value.push(value);
      }
      else if (value instanceof RichText) {
        this.value.push(...value.value);
      }
      else {
        this.value.push(...value);
      }
    }
  }
  
  public getCharacter(position: number) {
    return this.value[position];
  }
  
  public getCharacterSafe(position: number) {
    if (!this.value[position]) throw `Character at position [${position}] does not exist`;
    return this.value[position];
  }
  
  public getLines() {
    if (!this.length) return [];
    const lines = [[]] as Character[][];
    
    for (let i = 0; i < this.length; i++) {
      const character = this.getCharacterSafe(i);
      character.value === "\n" ? lines.push([]) : lines[lines.length - 1].push(character);
    }
    
    return lines;
  }
  
  
  public getTextDecoration() {
    if (!this.length) return new Decoration()
    
    const result = {} as Initializer<Decoration>;
    for (let i = 0; i < this.length; i++) {
      const decoration = this.value[i].decoration as Initializer<Decoration>;
      const properties = Util.getProperties(decoration);
      for (let j = 0; j < properties.length; j++) {
        const property = properties[j];
        const value =decoration[property]
        if (value === undefined) continue;
        
        if (typeof value === "string") {
          if (result[property] !== "") {
            if (result[property] === undefined) {
              Object.assign(result, {[property]: value});
            }
            else if (value !== result[property]) {
              Object.assign(result, {[property]: ""});
            }
          }
        }
        else {
          if (result[property] === undefined || (result[property] !== true && decoration !== false)) {
            Object.assign(result, {[property]: value});
          }
        }
      }
    }
    return new Decoration(result);
  }
  
  public hasDecoration<K extends keyof Initializer<Decoration>>(decoration: K, value: Initializer<Decoration>[K]) {
    for (let i = 0; i < this.length; i++) {
      const character = this.getCharacterSafe(i);
      if (character.decoration[decoration] !== value) return false;
    }
    return true;
  }
  
  public slice(start: number, end: number = this.value.length) {
    return new RichText(this.value.slice(Math.max(0, start), Math.min(end, this.value.length)));
  }
  
  public insert(value: Character | Character[] | RichText, [start, end]: [number, number]) {
    return new RichText(this.value.slice(0, start), value, this.value.slice(end));
  }
  
  public applyDecoration<K extends keyof Decoration>(decoration: K, value?: Decoration[K]) {
    const text = [] as Character[];
    
    for (let i = 0; i < this.length; i++) {
      const character = this.getCharacterSafe(i);
      text[i] = new Character(character.value, new Decoration({...character.decoration, [decoration]: value}));
    }
    
    return new RichText(text);
  }
  
  public static parseHTML(html: Node, decoration: Decoration = new Decoration()) {
    const text = [] as Character[];
    for (let i = 0; i < html.childNodes.length; i++) {
      const child = html.childNodes[i];
      if (child instanceof HTMLBRElement) {
        text.push(new Character("\n", decoration));
      }
      else if (child instanceof Text) {
        const content = child.textContent ?? "";
        for (let j = 0; j < content.length; j++) {
          text.push(new Character(content[j], decoration));
        }
      }
      else {
        text.push(...this.parseHTML(child, Decoration.parseHTML(child, decoration)).value);
      }
    }
    return new RichText(text);
  }
  
}
