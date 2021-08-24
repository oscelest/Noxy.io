import {v4} from "uuid";
import Decoration from "./Decoration";

export default class Character {

  public id: string;
  public value: string;
  public decoration: Decoration;

  constructor(value: string, decoration?: Initializer<Decoration>) {
    this.id = v4();
    this.value = value;
    this.decoration = new Decoration(decoration);
  }

  public static parseHTML(html: Node, decoration: Decoration = new Decoration()) {
    const text = [] as Character[]
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
        text.push(...this.parseHTML(child, Decoration.parseHTML(child, decoration)));
      }
    }
    return text;
  }

  public static hasDecoration(text: Character[], decoration: keyof Decoration) {
    for (let i = 0; i < text.length; i++) {
      if (!text[i].decoration[decoration]) return false;
    }
    return true;
  }

  public static getLines(text: Character[]) {
    if (!text?.length) return [];
    const lines = [[]] as Character[][];

    for (let i = 0; i < text.length; i++) {
      const character = text[i];
      character.value === "\n" ? lines.push([]) : lines[lines.length - 1].push(character);
    }

    return lines;
  }

  public static getSegmentList(line: Character[]) {
    const segment_list = [] as CharacterSegment[];

    for (let j = 0; j < line.length; j++) {
      const character = line[j];
      const segment = segment_list[segment_list.length - 1];

      if (!segment || !character.decoration.equals(segment.decoration)) {
        segment_list.push({text: [character], decoration: character.decoration});
      }
      else {
        segment.text.push(character);
      }
    }
    return segment_list;
  };


  public static applyDecoration<K extends keyof Decoration>(text: Character[], decoration: K, value?: Decoration[K]) {
    for (let i = 0; i < text.length; i++) {
      text[i] = new Character(text[i].value, new Decoration({...text[i].decoration, [decoration]: value}));
    }
    return text;
  }

}

export interface CharacterSegment {
  text: Character[],
  decoration: Decoration
}
