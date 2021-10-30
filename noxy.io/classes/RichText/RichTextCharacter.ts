import {v4} from "uuid";
import RichTextDecoration, {DecorationInitializer, DecorationObject} from "./RichTextDecoration";

export default class RichTextCharacter {
  
  public readonly id: string;
  public readonly value: string;
  public readonly decoration: RichTextDecoration;
  
  public static tab: string = "\t";
  public static linebreak: string = "\n";
  public static space: string = " ";
  
  constructor(initializer: RichTextCharacterInitializer) {
    this.id = v4();
    this.value = initializer instanceof RichTextCharacter ? initializer.value : initializer.value?.charAt(0) ?? " ";
    this.decoration = initializer instanceof RichTextCharacter ? initializer.decoration : new RichTextDecoration(initializer.decoration);
  }
  
  public static parseText(text?: string, decoration?: DecorationInitializer): RichTextCharacter[] {
    const value = [] as RichTextCharacter[];

    if (typeof text === "string") {
      for (let i = 0; i < text.length; i++) {
        const item = text.at(i);
        if (item) value.push(new RichTextCharacter({value: item, decoration}));
      }
    }
    
    return value;
  }
  
  public static parseContent(content: RichTextCharacterContent) {
    const value = [];
    
    for (let i = 0; i < content.fragment_list.length; i++) {
      const item = content.fragment_list.at(i);
      if (item) value.push(...this.parseText(item.text, item.decoration));
    }
    
    return value;
  }
  
  public static parseHTML(node: Node, decoration?: RichTextDecoration) {
    const text = [] as RichTextCharacter[];
    
    if (node instanceof HTMLBRElement) {
      text.push(new RichTextCharacter({value: RichTextCharacter.linebreak, decoration}));
    }
    else if (node instanceof Text) {
      for (let i = 0; i < node.data.length; i++) {
        const value = node.data.at(i);
        if (value) text.push(new RichTextCharacter({value, decoration}));
      }
    }
    else if (node instanceof HTMLElement) {
      decoration = RichTextDecoration.parseHTML(node, decoration);
      for (let i = 0; i < node.children.length; i++) {
        const item = node.childNodes.item(i);
        if (item) text.push(...this.parseHTML(item, decoration));
      }
    }
    
    return text;
  }
  
}

export interface RichTextCharacterInitializer {
  value?: string;
  decoration?: Initializer<RichTextDecoration>;
}

export interface RichTextCharacterContent {
  fragment_list: RichTextSectionContentFragment[];
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
