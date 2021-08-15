import Decoration from "../../common/enums/Decoration";
import React from "react";

export default class HTMLText {

  private readonly text: Character[];
  private readonly element: Element;
  private readonly selection: Selection;
  private readonly redo_history: HistoryElement[];
  private readonly undo_history: HistoryElement[];

  private static linebreak_character = {value: "\n", decoration: 0};
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
    this.selection = {start: 0, length: 0, end: 0};
    this.undo_history = [];
    this.redo_history = [];

    if (value) {
      Array.isArray(value) ? this.insertCharacter(value) : this.insertHTML(value);
    }
  }

  public getLength() {
    return this.text.length;
  }

  public getSelection() {
    return this.selection;
  }

  public setSelection(selection: FixedSelection | FlexibleSelection) {
    const {start, end, length} = this.parseSelection(selection);
    this.selection.start = start;
    this.selection.end = end;
    this.selection.length = length;
    return this;
  }

  public getCharacter(position: number): Character | undefined {
    return this.text[position];
  }

  public getCharacterDecoration(position: number = this.selection.start - 1) {
    position = Math.min(Math.max(position, 0), this.text.length - 1);
    return this.getCharacter(position)?.decoration ?? Decoration.NONE;
  }

  public getCharacterList(selection: FixedSelection | FlexibleSelection = this.selection) {
    const {start, end} = this.parseSelection(selection);
    return this.text.slice(start, end);
  }

  public setCharacterList(list: Character | Character[]) {
    this.text.splice(0, this.text.length, ...(Array.isArray(list) ? list : [list]));
    return this;
  }

  public insertNewLine(decoration: Decoration | Decoration[] = Decoration.NONE, selection?: FixedSelection | FlexibleSelection) {
    this.insertCharacter(HTMLText.linebreak_character, selection);
    return this;
  }

  public insertHTML(html: string, decoration: Decoration | Decoration[] = Decoration.NONE, selection?: FixedSelection | FlexibleSelection) {
    this.element.innerHTML = html;
    this.insertCharacter(this.parseElement(this.element, HTMLText.parseDecoration(decoration)), selection);
    return this;
  }

  public insertCharacter(list: Character | Character[], selection: FixedSelection | FlexibleSelection = this.selection) {
    const {start, length} = this.parseSelection(selection);

    if (Array.isArray(list) && !list.length || !Array.isArray(list) && !list.value) return this;
    this.writeStateToHistory();
    if (Array.isArray(list)) {
      this.text.splice(start, length, ...list);
      return this.setSelection({start: start + list.length, length: 0});
    }

    this.text.splice(start, length, list);
    return this.setSelection({start: start + 1, length: 0});
  }

  public deleteForward() {
    return this.delete(this.selection.start === this.selection.end ? {start: this.selection.start, length: 1} : {start: this.selection.start, end: this.selection.end});
  }

  public deleteBackward() {
    return this.delete(this.selection.start === this.selection.end ? {start: this.selection.start, length: -1} : {start: this.selection.start, end: this.selection.end});
  }

  public deleteWordForward() {
    if (this.selection.start === this.selection.end) {
      this.selectPatternForward(/\p{Z}/u);
      const character = this.getCharacter(this.selection.start - 1)?.value;
      if (character) {
        this.selectPatternForward(character.match(/[\p{L}\p{N}]/u) ? /[\p{L}\p{N}]/u : /[^\p{L}\p{N}]/u);
        this.selectPatternForward(/\p{Z}/u);
      }
    }

    return this.delete();
  }

  public deleteWordBackward() {
    if (this.selection.start === this.selection.end) {
      this.selectPatternBackward(/\p{Z}/u);
      const character = this.getCharacter(this.selection.start - 1)?.value;
      if (character) {
        this.selectPatternBackward(character.match(/[\p{L}\p{N}]/u) ? /[\p{L}\p{N}]/u : /[^\p{L}\p{N}]/u);
        this.selectPatternBackward(/\p{Z}/u);
      }
    }

    return this.delete();
  }

  public delete(selection: FixedSelection | FlexibleSelection = this.selection) {
    const {start, length} = this.parseSelection(selection);

    if (length <= 0) return this;
    this.writeStateToHistory();
    this.text.splice(start, length);
    return this.setSelection({start, length: 0});
  }

  public addDecoration(decoration: Decoration | Decoration[], selection?: FixedSelection | FlexibleSelection) {
    return this.decorate(decoration, (decoration, decorator) => decoration | decorator, selection);
  }

  public removeDecoration(decoration: Decoration | Decoration[], selection?: FixedSelection | FlexibleSelection) {
    return this.decorate(decoration, (decoration, decorator) => decoration & ~decorator, selection);
  }

  public setDecoration(decoration: Decoration | Decoration[], selection?: FixedSelection | FlexibleSelection) {
    return this.decorate(decoration, (decoration, decorator) => decorator, selection);
  }

  public changeDecoration(decoration: Decoration | Decoration[], selection: FixedSelection | FlexibleSelection = this.selection) {
    const {start, end, length} = this.parseSelection(selection);
    const decorator = HTMLText.parseDecoration(decoration);

    return this.text.slice(start, end).every(char => (char.decoration & decorator))
      ? this.removeDecoration(decorator, {start, end, length})
      : this.addDecoration(decorator, {start, end, length});
  }

  private decorate(decoration: Decoration | Decoration[], fn: (decoration: number, decorator: number) => number, selection: FixedSelection | FlexibleSelection = this.selection) {
    const {start, length} = this.parseSelection(selection);
    const decorator = HTMLText.parseDecoration(decoration);

    if (length <= 0) return this;
    this.writeStateToHistory();
    for (let i = start; i < start + length; i++) {
      if (this.text[i]) this.text[i].decoration = fn(this.text[i].decoration, decorator);
    }

    return this;
  }

  public selectPatternForward(regex: RegExp): void {
    while (this.getCharacter(this.selection.end)?.value.match(regex)) {
      this.selection.end++;
      this.selection.length++;
    }
  }

  public selectPatternBackward(regex: RegExp): void {
    while (this.getCharacter(this.selection.start - 1)?.value.match(regex)) {
      this.selection.start--;
      this.selection.length++;
    }
  }

  private writeStateToHistory() {
    this.undo_history.push({text: [...this.text], selection: {...this.selection}});
    this.redo_history.length = 0;
    if (this.undo_history.length > 100) this.undo_history.shift();
  }

  public undo() {
    const item = this.undo_history.pop();
    if (!item) return this;
    this.redo_history.push({text: [...this.text], selection: {...this.selection}});
    this.setCharacterList(item.text);
    this.setSelection(item.selection);
    return this;
  }

  public redo() {
    const item = this.redo_history.pop();
    if (!item) return this;
    this.undo_history.push({text: [...this.text], selection: {...this.selection}});
    this.setCharacterList(item.text);
    this.setSelection(item.selection);
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
    // TODO: Should analyse character list and split into lines, then blocks.
    return this.getBlockHierarchy().map(this.createReactElementBlock);
  }

  private readonly createReactElementBlock = (block: Block, key: number = 0) => {
    return React.createElement("div", {key, children: this.createReactElementDecoration(block)});
  };

  private readonly createReactElementDecoration = (block: RenderBlock, key: number = 0): React.ReactNode => {
    const render = block.render ?? block.decoration;
    if (render & Decoration.CODE) return React.createElement("code", {key, children: this.createReactElementDecoration({...block, render: render - Decoration.CODE})});
    if (render & Decoration.BOLD) return React.createElement("b", {key, children: this.createReactElementDecoration({...block, render: render - Decoration.BOLD})});
    if (render & Decoration.ITALIC) return React.createElement("i", {key, children: this.createReactElementDecoration({...block, render: render - Decoration.ITALIC})});
    if (render & Decoration.UNDERLINE) return React.createElement("u", {key, children: this.createReactElementDecoration({...block, render: render - Decoration.UNDERLINE})});
    if (render & Decoration.STRIKETHROUGH) return React.createElement("s", {key, children: this.createReactElementDecoration({...block, render: render - Decoration.STRIKETHROUGH})});
    if (render & Decoration.MARK) return React.createElement("mark", {key, children: this.createReactElementDecoration({...block, render: render - Decoration.MARK})});

    if (block.value.length === 1 && block.value[0] === HTMLText.linebreak_character.value) return React.createElement("br", {key});
    return block.value.map(this.createReactElementContent);
  };

  private readonly createReactElementContent = (block: string | Block, key: number = 0) => {
    if (typeof block !== "string") return this.createReactElementDecoration(block, key);
    block = block.replace(/\n/g, "").replace(/(?<!\b)\s(?!\b)?|\s$/g, "\u00A0");
    return block;
  };

  //endregion ----- toReactElementList -----

  //region    ----- Common private methods -----

  private static parseDecoration(decoration: Decoration | Decoration[]) {
    return Array.isArray(decoration) ? decoration.reduce((result, value) => result + value, 0) : decoration;
  };

  private parseSelection(selection: FixedSelection): Selection
  private parseSelection(selection: FlexibleSelection): Selection
  private parseSelection({start, end, length}: Selection): Selection {
    if (start === this.selection.start && end === this.selection.end && length === this.selection.end) {
      return {start, end, length};
    }

    if (start < 0) {
      start = Math.min(this.text.length, Math.max(0, this.text.length - start));
    }

    if (length !== undefined) {
      if (length < 0) {
        start += length;
        length = Math.abs(length);
        end = start + length;
      }

      end = start + length;
    }
    else if (end !== undefined) {
      if (end < 0) {
        end = Math.min(this.text.length, Math.max(0, this.text.length - end));
      }

      if (start > end) {
        start = start + end;
        end = start - end;
        start = start - end;
      }

      length = end - start;
    }
    else {
      end = start;
      length = 0;
    }

    return {start, end, length};
  }

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
          result.push(HTMLText.linebreak_character);
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
        if (!result.length || character.value === HTMLText.linebreak_character.value) {
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
    if (block.decoration === 0 || character.decoration & block.decoration) {
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

export type Selection = Required<(FixedSelection & FlexibleSelection)>

export interface FlexibleSelection {
  start: number;
  end?: number;
}

export interface FixedSelection {
  start: number;
  length?: number;
}

export interface Character {
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

interface HistoryElement {
  selection: Selection;
  text: Character[];
}

type DecorationList = [Decoration, string[]][]
