import {v4} from "uuid";
import RichTextDecoration, {RichTextDecorationInitializer, RichTextDecorationObject} from "./RichTextDecoration";

export default class RichTextCharacter {

  public readonly id: string;
  public readonly value: string;
  public readonly decoration: RichTextDecoration;

  public static tab: string = "\t";
  public static linebreak: string = "\n";
  public static space: string = " ";

  constructor(initializer: RichTextCharacterInitializer) {
    this.id = initializer.id ?? v4();
    this.value = initializer instanceof RichTextCharacter ? initializer.value : initializer.value?.charAt(0) ?? " ";
    this.decoration = initializer.decoration instanceof RichTextDecoration ? initializer.decoration : new RichTextDecoration(initializer.decoration);
  }

  public clone() {
    return new RichTextCharacter({
      id:         this.id,
      value:      this.value,
      decoration: this.decoration.clone(),
    });
  }

  public static parseContent(content: RichTextCharacterContent) {
    const value = [] as RichTextCharacter[];

    for (let i = 0; i < content.fragment_list.length; i++) {
      const item = content.fragment_list.at(i);
      if (item) value.push(...this.parseText(item.text, item.decoration));
    }

    return value;
  }

  public static parseText(text?: string, decoration?: RichTextDecorationInitializer): RichTextCharacter[] {
    const value = [] as RichTextCharacter[];

    if (typeof text === "string") {
      for (let i = 0; i < text.length; i++) {
        const item = text.at(i);
        if (item) value.push(new RichTextCharacter({value: item, decoration}));
      }
    }

    return value;
  }

  public static parseHTML(element: HTMLElement, decoration?: RichTextDecoration) {
    const text = [] as RichTextCharacter[][];
    const node = element instanceof HTMLTemplateElement ? element.content : element;

    for (let i = 0; i < node.childNodes.length; i++) {
      const item = node.childNodes.item(i);
      if (!item || item instanceof HTMLBRElement || !(item instanceof Text) && item.childNodes.length === 0) continue;

      if (item instanceof Text) {
        text.push(RichTextCharacter.parseText(item.data, RichTextDecoration.parseHTML(element, decoration)));
      }
      else if (item instanceof HTMLElement) {
        text.push(RichTextCharacter.parseHTML(item, decoration));
      }
    }

    const value = [] as RichTextCharacter[];
    for (let i = 0; i < text.length; i++) {
      value.push(...text[i]);
      if (i > 0 && i < text.length - 1) {
        value.push(new RichTextCharacter({value: RichTextCharacter.linebreak, decoration: RichTextDecoration.parseHTML(element, decoration)}));
      }
    }

    return value;
  }

}

export interface RichTextCharacterInitializer {
  id?: string;
  value?: string;
  decoration?: Initializer<RichTextDecoration>;
}

export interface RichTextCharacterContent {
  fragment_list: RichTextFragmentContent[];
  index: number;
  start: number;
  end: number;
}

export interface RichTextFragmentContent {
  text: string;
  decoration: RichTextDecorationObject;
  start: number;
  end: number;
}
