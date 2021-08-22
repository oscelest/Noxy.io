import DecorationValue from "../../common/enums/DecorationValue";
import React from "react";

export default class HTMLText {

  private readonly text: Character[];
  private readonly element: HTMLTemplateElement;
  private readonly selection: Selection;
  private readonly redo_history: HistoryElement[];
  private readonly undo_history: HistoryElement[];

  private static linebreak_character = {value: "\n", decoration: 0};
  private static decoration_list: DecorationList = [
    [DecorationValue.CODE, ["CODE"]],
    [DecorationValue.BOLD, ["B", "STRONG"]],
    [DecorationValue.ITALIC, ["I"]],
    [DecorationValue.UNDERLINE, ["U"]],
    [DecorationValue.STRIKETHROUGH, ["S"]],
    [DecorationValue.MARK, ["MARK"]],
  ];

  constructor(value?: string | Character[]) {
    this.text = [];
    this.element = document.createElement("template");
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
    return this.getCharacter(position)?.decoration ?? DecorationValue.NONE;
  }

  public getCharacterList(selection: FixedSelection | FlexibleSelection = this.selection) {
    const {start, end} = this.parseSelection(selection);
    return this.text.slice(start, end);
  }

  public setCharacterList(list: Character | Character[]) {
    this.text.splice(0, this.text.length, ...(Array.isArray(list) ? list : [list]));
    return this;
  }

  public insertNewLine(decoration: DecorationValue | DecorationValue[] = DecorationValue.NONE, selection?: FixedSelection | FlexibleSelection) {
    this.insertCharacter(HTMLText.linebreak_character, selection);
    return this;
  }

  public insertHTML(html: string, decoration: DecorationValue | DecorationValue[] = DecorationValue.NONE, selection?: FixedSelection | FlexibleSelection) {
    this.element.innerHTML = html;
    this.insertCharacter(this.parseElement(this.element.content, HTMLText.parseDecoration(decoration)), selection);
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
      const character = this.getCharacter(this.selection.start)?.value;
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

  public addDecoration(decoration: DecorationValue | DecorationValue[], selection?: FixedSelection | FlexibleSelection) {
    return this.decorate(decoration, (decoration, decorator) => decoration | decorator, selection);
  }

  public removeDecoration(decoration: DecorationValue | DecorationValue[], selection?: FixedSelection | FlexibleSelection) {
    return this.decorate(decoration, (decoration, decorator) => decoration & ~decorator, selection);
  }

  public setDecoration(decoration: DecorationValue | DecorationValue[], selection?: FixedSelection | FlexibleSelection) {
    return this.decorate(decoration, (decoration, decorator) => decorator, selection);
  }

  public changeDecoration(decoration: DecorationValue | DecorationValue[], selection: FixedSelection | FlexibleSelection = this.selection) {
    const {start, end, length} = this.parseSelection(selection);
    const decorator = HTMLText.parseDecoration(decoration);

    return this.text.slice(start, end).every(char => (char.decoration & decorator))
      ? this.removeDecoration(decorator, {start, end, length})
      : this.addDecoration(decorator, {start, end, length});
  }

  private decorate(decoration: DecorationValue | DecorationValue[], fn: (decoration: number, decorator: number) => number, selection: FixedSelection | FlexibleSelection = this.selection) {
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
    const list = this.getTextLineList();
    const html = document.createElement("div");
    for (let i = 0; i < list.length; i++) {
      html.append(this.createHTMLNodeLine(list[i]));
    }
    return html;
  }

  private readonly createHTMLNodeLine = (block: Block): Node => {
    const line = document.createElement("div");
    for (let i = 0; i < block.value.length; i++) {
      line.append(this.createHTMLNodeDecoration(block.value[i]));
    }
    return line;
  };

  private readonly createHTMLNodeDecoration = (block: string | Block): Node => {
    if (typeof block !== "string") {
      const node_decoration = document.createElement(this.getHTMLNodeTag(block.decoration));
      for (let i = 0; i < block.value.length; i++) {
        node_decoration.append(this.createHTMLNodeDecoration(block.value[i]));
      }
      return node_decoration;
    }

    if (block.length === 1 && block === HTMLText.linebreak_character.value) return document.createElement("br");
    return document.createTextNode(block);
  };

  //endregion ----- toHTML -----

  //region    ----- toReactElementList -----

  public toReactElementList() {
    return this.getTextLineList().map(this.createReactElementLine);
  }

  private readonly createReactElementLine = (block: Block, key: number = 0) => {
    const children = block.value.length === 1 && block.value[0] === HTMLText.linebreak_character.value ? React.createElement("br", {key}) : block.value.map(this.createReactElementDecoration);
    return React.createElement("div", {key, children});
  };

  private readonly createReactElementDecoration = (block: string | Block, key: number = 0): React.ReactNode => {
    if (typeof block !== "string") {
      return React.createElement(this.getHTMLNodeTag(block.decoration), {key, children: block.value.map(this.createReactElementDecoration)});
    }

    return block.replace(/\n/g, "").replace(/(?<!\b)\s(?!\b)?|\s$/g, "\u00A0");
  };

  private readonly getHTMLNodeTag = (decoration: DecorationValue) => {
    switch (decoration) {
      case DecorationValue.NONE:
        return "span";
      case DecorationValue.CODE:
        return "code";
      case DecorationValue.BOLD:
        return "b";
      case DecorationValue.ITALIC:
        return "i";
      case DecorationValue.UNDERLINE:
        return "u";
      case DecorationValue.STRIKETHROUGH:
        return "s";
      case DecorationValue.MARK:
        return "mark";
    }
  };

  //endregion ----- toReactElementList -----

  //region    ----- Common private methods -----

  private static parseDecoration(decoration: DecorationValue | DecorationValue[]) {
    return Array.isArray(decoration) ? decoration.reduce((result, value) => result + value, 0) : decoration;
  };

  private parseSelection(selection: FixedSelection | FlexibleSelection | Selection): Selection {
    let {start, end, length} = selection as Selection;
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
        if (child instanceof Comment) continue;

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

  private readonly getTextLineList = () => {
    return this.text.reduce(
      (result, character) => {
        if (!result.length || character.value === HTMLText.linebreak_character.value) {
          result.push({value: [], decoration: DecorationValue.NONE});
        }

        this.appendCharacter(character, result[result.length - 1]);
        return result;
      }, [] as Block[],
    );
  };

  private readonly appendCharacter = (character: Character, block: Block): Block => {
    const sub_block = block.value[block.value.length - 1];

    if (character.decoration === block.decoration || character.decoration === 0) {
      if (typeof sub_block === "string") {
        block.value[block.value.length - 1] += character.value;
      }
      else {
        block.value.push(character.value);
      }
    }
    else if (!sub_block || typeof sub_block === "string" || !(character.decoration & sub_block.decoration)) {
      for (let i = 0; i < HTMLText.decoration_list.length; i++) {
        const decoration = HTMLText.decoration_list[i][0];
        if (!(HTMLText.decoration_list[i][0] & character.decoration)) continue;

        const next_block = {value: [], decoration: decoration} as Block;
        character.decoration === decoration
          ? next_block.value.push(character.value)
          : this.appendCharacter({value: character.value, decoration: character.decoration - decoration}, next_block);

        block.value.push(next_block);
        break;
      }
    }
    else {
      this.appendCharacter({value: character.value, decoration: character.decoration - sub_block.decoration}, sub_block);
    }
    return block;
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

interface Block {
  value: (string | Block)[];
  decoration: DecorationValue;
}

interface HistoryElement {
  selection: Selection;
  text: Character[];
}

type DecorationList = [DecorationValue, string[]][]
