import Decoration from "../../common/enums/Decoration";
import React from "react";

export default class HTMLText {

  private readonly text: Character[];
  private readonly element: Element;

  private static decoration_list: DecorationList = [
    [Decoration.CODE, ["CODE"]],
    [Decoration.BOLD, ["B", "STRONG"]],
    [Decoration.ITALIC, ["I"]],
    [Decoration.UNDERLINE, ["U"]],
    [Decoration.STRIKETHROUGH, ["S"]],
    [Decoration.MARK, ["MARK"]],
  ];

  constructor(value?: string | Character[]) {
    this.text = [];
    this.element = document.createElement("div");

    if (value) {
      Array.isArray(value) ? this.addCharacterList(value) : this.addHTML(value);
    }
  }

  public getCharacterList(start: number = 0, end: number = this.text.length) {
    return this.text.slice(start, end);
  }

  public addCharacterList(list: Character[], start: number = this.text.length, replace: number = 0) {
    this.text.splice(start, replace, ...list);
    return this;
  }

  public addHTML(text: string, decoration: Decoration | Decoration[] = Decoration.NONE, start: number = this.text.length, replace: number = 0) {
    this.element.innerHTML = text;
    this.text.splice(start, replace, ...this.parseElement(this.element, this.resolveDecoration(decoration)));
    return this;
  }

  public setHTML(text: string, decoration: Decoration | Decoration[] = []) {
    this.element.innerHTML = text;
    this.text.splice(0, this.text.length, ...this.parseElement(this.element, this.resolveDecoration(decoration)));
    return this;
  }

  public remove(start: number = 0, end: number = this.text.length) {
    this.text.splice(start, end);
    return this;
  }

  public addDecoration(decoration: Decoration | Decoration[], start: number = 0, end: number = this.text.length) {
    decoration = this.resolveDecoration(decoration);
    for (let i = start; i < end; i++) {
      if (this.text[i]) this.text[i].decoration = this.text[i].decoration | decoration;
    }
    return this;
  }

  public removeDecoration(decoration: Decoration | Decoration[], start: number = 0, end: number = this.text.length) {
    decoration = this.resolveDecoration(decoration);
    for (let i = start; i < end; i++) {
      if (this.text[i]) this.text[i].decoration = this.text[i].decoration & ~decoration;
    }
    return this;
  }

  public setDecoration(decoration: Decoration | Decoration[], start: number = 0, end: number = this.text.length) {
    decoration = this.resolveDecoration(decoration);
    for (let i = start; i < end; i++) {
      if (this.text[i]) this.text[i].decoration = decoration;
    }
    return this;
  }

  //region    ----- toHTML -----

  public toHTML() {
    const hierarchy = this.getBlockHierarchy();
    const container = document.createElement("div");
    for (let i = 0; i < hierarchy.length; i++) {
      const block = hierarchy[i];
      container.append(this.createHTMLNodeHierarchy(block));
    }
    return container.innerHTML;
  }

  private readonly createHTMLNodeHierarchy = (block: Block): Node => {
    const element = this.createHTMLNode(block.decoration);
    if (element instanceof Text) {
      for (let i = 0; i < block.value.length; i++) {
        const value = block.value[i];
        if (typeof value === "string") {
          element.textContent += value;
        }
        else {
          throw "Block cannot exists inside non-decorated text.";
        }
      }
    }
    else {
      for (let i = 0; i < block.value.length; i++) {
        const value = block.value[i];
        if (typeof value === "string") {
          element.appendChild(document.createTextNode(value));
        }
        else {
          element.appendChild(this.createHTMLNodeHierarchy(value));
        }
      }
    }

    return element;
  };

  private readonly createHTMLNode = (decoration: number, container?: Node): Node => {
    if (decoration & Decoration.CODE) return this.createHTMLNodeHelper("code", Decoration.CODE, decoration, container);
    if (decoration & Decoration.MARK) return this.createHTMLNodeHelper("mark", Decoration.MARK, decoration, container);
    if (decoration & Decoration.BOLD) return this.createHTMLNodeHelper("b", Decoration.BOLD, decoration, container);
    if (decoration & Decoration.ITALIC) return this.createHTMLNodeHelper("i", Decoration.ITALIC, decoration, container);
    if (decoration & Decoration.STRIKETHROUGH) return this.createHTMLNodeHelper("s", Decoration.STRIKETHROUGH, decoration, container);
    if (decoration & Decoration.UNDERLINE) return this.createHTMLNodeHelper("u", Decoration.UNDERLINE, decoration, container);
    return container ?? document.createTextNode("");
  };

  private readonly createHTMLNodeHelper = (tag: keyof React.ReactHTML, decorator: Decoration, decoration: number, container?: Node) => {
    const element = this.createHTMLNode(decoration - decorator, document.createElement(tag));
    if (container) {
      container.appendChild(element);
    }
    return element;
  };

  //endregion ----- toHTML -----

  //region    ----- toReactElementList -----

  public toReactElementList() {
    return this.getBlockHierarchy().map(this.createReactElement);
  }

  private readonly createReactElement = (block: RenderBlock, index: number = 0): React.ReactNode => {
    const render = block.render ?? block.decoration;
    if (render & Decoration.CODE) return this.createReactElementHelper(block, "code", Decoration.CODE, index);
    if (render & Decoration.BOLD) return this.createReactElementHelper(block, "b", Decoration.BOLD, index);
    if (render & Decoration.ITALIC) return this.createReactElementHelper(block, "i", Decoration.ITALIC, index);
    if (render & Decoration.UNDERLINE) return this.createReactElementHelper(block, "u", Decoration.UNDERLINE, index);
    if (render & Decoration.STRIKETHROUGH) return this.createReactElementHelper(block, "s", Decoration.STRIKETHROUGH, index);
    if (render & Decoration.MARK) return this.createReactElementHelper(block, "mark", Decoration.MARK, index);

    return block.value.map(value => {
      if (typeof value === "string") return this.createReactElementText(value);
      return this.createReactElement({...value, decoration: value.decoration - block.decoration});
    });
  };

  private readonly createReactElementText = (text: string) => {
    return text.split("\n").flatMap((value, index, array) => array.length - 1 !== index ? [value, React.createElement("br")] : value);
  };

  private readonly createReactElementHelper = (block: RenderBlock, type: keyof React.ReactHTML, decoration: Decoration, key: number = 0) => {
    return React.createElement(type, {key, children: this.createReactElement({...block, render: (block.render ?? block.decoration) - decoration})});
  };

  //endregion ----- toReactElementList -----

  //region    ----- Common private methods -----

  private readonly resolveDecoration = (decoration: Decoration | Decoration[]) => {
    return Array.isArray(decoration) ? decoration.reduce((result, value) => result + value, 0) : decoration;
  };

  private readonly parseElement = (element: Node, decoration: number = 0): Character[] => {
    const result = [] as Character[];

    if (!element.childNodes.length) {
      const text = element.textContent ?? "";
      for (let i = 0; i < text.length; i++) {
        result.push({value: text[i], decoration: decoration});
      }
    }
    else {
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes.item(i);

        if (child instanceof Text) {
          result.push(...this.parseElement(child, decoration));
        }
        else if (child instanceof HTMLBRElement) {
          result.push({value: "\n", decoration: 0});
        }
        else {
          result.push(...this.parseInnerElement(child, decoration));
        }
      }
    }

    return result;
  };

  private readonly parseInnerElement = (node: ChildNode, decoration: number) => {
    for (let i = 0; i < HTMLText.decoration_list.length; i++) {
      const [decorator, name_list] = HTMLText.decoration_list[i];
      if (name_list.includes(node.nodeName)) {
        return this.parseElement(node, decoration | decorator);
      }
    }

    return this.parseElement(node, decoration);
  };

  private readonly getBlockHierarchy = () => {
    return this.text.reduce(
      (result, character) => {
        if (!result.length) {
          return [...result, {value: [character.value], decoration: character.decoration}];
        }

        const block = this.findCharacterBlock(character, result[result.length - 1]);
        if (!block) {
          return [...result, {value: [character.value], decoration: character.decoration}];
        }

        if (typeof block.value[block.value.length - 1] === "string") {
          block.value[block.value.length - 1] += character.value;
        }
        else {
          block.value.push(character.value);
        }

        return result;
      },
      [] as Block[],
    );
  };

  private readonly findCharacterBlock = (character: Character, block: Block): Block | null => {
    if (character.decoration === block.decoration) return block;
    if (character.decoration & block.decoration) {
      const next = block.value.find(value => typeof value !== "string") as undefined | Block;
      if (!block.value.length || !next) {
        const next = {value: [], decoration: character.decoration};
        block.value.push(next);
        return next;
      }
      return this.findCharacterBlock(character, next);
    }
    return null;
  };

  //endregion ----- Common private methods -----

}

interface Character {
  value: string;
  decoration: number;
}

interface RenderBlock extends Block {
  render?: number;
}

interface Block {
  value: (string | Block)[];
  decoration: number;
}

type DecorationList = [Decoration, string[]][]
