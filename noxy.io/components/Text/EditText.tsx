import React from "react";
import ClipboardDataType from "../../../common/enums/ClipboardDataType";
import Util from "../../../common/services/Util";
import Character from "../../classes/Character";
import Decoration from "../../classes/Decoration";
import RichText from "../../classes/RichText";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Helper from "../../Helper";
import Component from "../Application/Component";
import Style from "./EditText.module.scss";

export default class EditText extends Component<EditTextProps, State> {
  
  private template: HTMLTemplateElement = document.createElement("template");
  
  constructor(props: EditTextProps) {
    super(props);
    this.state = {
      ref:          React.createRef(),
      selection:    {start: 0, end: 0, forward: true},
      redo_history: [],
      undo_history: [],
    };
  }
  
  public getText(): RichText {
    return this.props.children;
  };
  
  public getSelection(): Selection {
    const selection = getSelection();
    if (!selection || !selection.focusNode || !selection.anchorNode) return this.state.selection;
    if (!this.state.ref.current) throw "Could not get reference element.";
    
    if (this.state.ref.current.contains(selection.focusNode) && this.state.ref.current.contains(selection.anchorNode)) {
      const focus_node = selection.focusNode;
      const anchor_node = selection.anchorNode;
      const focus_offset = selection.focusOffset;
      const anchor_offset = selection.anchorOffset;
      
      const focus_position = this.getPositionByNode(focus_node) + focus_offset;
      const anchor_position = this.getPositionByNode(anchor_node) + anchor_offset;
      
      return {
        start:   Math.max(Math.min(focus_position, anchor_position), 0),
        end:     Math.min(Math.max(focus_position, anchor_position), this.props.children.length),
        forward: focus_position >= anchor_position,
      };
    }
    else {
      return this.state.selection;
    }
  };
  
  public isDecorationDisabled = (decoration: keyof Initializer<Decoration>): boolean => {
    return !!(this.props.whitelist?.length && !this.props.whitelist.includes(decoration) || this.props.blacklist?.includes(decoration));
  };
  
  public select(start: number = 0, end: number = this.getText().length, forward: boolean = true) {
    this.setState({selection: {start, end, forward}});
  };
  
  public insert(character: string, selection: Selection = this.getSelection()) {
    if (character.length !== 1) throw "Insert string must be a single character.";
    this.insertText(new Character(character, this.getText().getCharacter(Math.max(0, selection.start - 1))?.decoration), selection);
  };
  
  public decorate(decoration: Initializer<Decoration>, selection: Selection = this.getSelection()) {
    selection = this.parseSelection(selection);
    
    let text = this.getText().slice(selection.start, selection.end);
    let keys = Util.getProperties(decoration);
    if (this.props.whitelist?.length) keys = keys.filter(value => this.props.whitelist!.includes(value));
    if (this.props.blacklist?.length) keys = keys.filter(value => !this.props.blacklist!.includes(value));
    
    for (let i = 0; i < keys.length; i++) {
      text = text.applyDecoration(keys[i], text.hasDecoration(keys[i]) ? undefined : decoration[keys[i]]);
    }
    
    this.insertText(text, selection, false);
  };
  
  public deleteForward(selection: Selection = this.getSelection()) {
    if (selection.start === this.getText().length && selection.end === this.getText().length) return;
    if (selection.start === selection.end) selection.end = Math.min(selection.end + 1, this.getText().length);
    
    this.insertText(new RichText(), selection);
  };
  
  public deleteBackward(selection: Selection = this.getSelection()) {
    if (!selection.start && !selection.end) return;
    if (selection.start === selection.end) selection.start = Math.max(0, selection.start - 1);
    
    this.insertText(new RichText(), selection);
  };
  
  public deleteWordForward(selection: Selection = this.getSelection()) {
    if (selection.start !== selection.end || selection.end === this.getText().length) return this.deleteBackward(selection);
    
    selection.end = this.find(/[^\p{Z}]/u, selection.end) ?? this.getText().length;
    selection.end = this.find(this.getText().getCharacterSafe(selection.end).value.match(/[\p{L}\p{N}]/u) ? /[^\p{L}\p{N}]/u : /[\p{L}\p{N}\p{Z}]/u, selection.end) ?? this.getText().length;
    selection.end = this.find(/[^\p{Z}]/u, selection.end) ?? this.getText().length;
    
    this.insertText(new RichText(), selection);
  }
  
  public deleteWordBackward(selection: Selection = this.getSelection()) {
    if (selection.start !== selection.end || !selection.start) return this.deleteBackward(selection);
    
    selection.start = this.find(/[^\p{Z}]/u, selection.start, false) ?? 0;
    selection.start = this.find(this.getText().getCharacterSafe(selection.start).value.match(/[\p{L}\p{N}]/u) ? /[^\p{L}\p{N}]/u : /[\p{L}\p{N}\p{Z}]/u, selection.start, false) ?? 0;
    selection.start = this.find(/[^\p{Z}]/u, selection.start, false) ?? 0;
    
    this.insertText(new RichText(), {...selection, start: selection.start ? selection.start + 1 : selection.start});
  }
  
  public undo() {
    const item = this.state.undo_history[this.state.undo_history.length - 1];
    if (!item) return this;
    
    this.props.onChange(item.text, this);
    this.setState({
      selection:    item.selection,
      redo_history: [...this.state.redo_history, {text: this.props.children, selection: this.getSelection()}],
      undo_history: this.state.undo_history.slice(0, this.state.undo_history.length - 1),
    });
  }
  
  public redo() {
    const item = this.state.redo_history[this.state.redo_history.length - 1];
    if (!item) return this;
    
    this.props.onChange(item.text, this);
    this.setState({
      selection:    item.selection,
      redo_history: this.state.redo_history.slice(0, this.state.redo_history.length - 1),
      undo_history: [...this.state.undo_history, {text: this.props.children, selection: this.getSelection()}],
    });
  }
  
  private insertText(insert: Character | Character[] | RichText, selection: Selection = this.getSelection(), clear_selection = true) {
    selection = this.parseSelection(selection);
    const length = insert instanceof Character ? 1 : insert.length;
    const text = this.getText().insert(insert, [selection.start, selection.end]);
    const next_selection = clear_selection ? {start: selection.start + length, end: selection.start + length, forward: selection.forward} : selection;
    
    this.props.onChange(text, this);
    console.log("Inserting", next_selection);
    this.setState({selection: next_selection, redo_history: [], undo_history: [...this.state.undo_history, {text: this.props.children, selection}]});
  };
  
  private find(regex: RegExp, position: number, forward: boolean = true): number | undefined {
    position = forward ? position : position - 1;
    const character = this.getText().getCharacter(position);
    if (!character) return undefined;
    return character.value.match(regex) ? position : this.find(regex, forward ? position + 1 : position, forward);
  };
  
  private appendHTMLNode(node: Node, segment: Segment) {
    node.appendChild(this.renderHTMLNode(segment));
    return node;
  };
  
  private parseSelection(selection?: Selection): Selection {
    if (!selection) return {start: 0, end: this.getText().length, forward: true};
    if (isNaN(+selection.start)) selection.start = 0;
    if (isNaN(+selection.end)) selection.end = this.getText().length;
    
    selection.start = Math.max(Math.min(selection.start, selection.end), 0);
    selection.end = Math.min(Math.max(selection.start, selection.end), this.getText().length);
    return selection;
  };
  
  private getNodeByPosition(position: number, parent: Node | null = this.state.ref.current): {position: number, element: Node} {
    if (!parent) throw "Could not get container element.";
    
    for (let i = 0; i < parent.childNodes.length; i++) {
      const child = parent.childNodes[i];
      const content = child.textContent?.length ?? 0;
      if (content >= position) return this.getNodeByPosition(position, child);
      if (parent === this.state.ref.current) position -= 1;
      position -= content;
    }
    
    return {position, element: parent};
  };
  
  private getPositionByNode(node: Node, parent: Node | null = this.state.ref.current): number {
    if (!parent) throw "Could not get container element.";
    if (node === parent) return 0;
    const container = this.getClosestContainer(node, parent);
    
    let length = 0;
    for (let i = 0; i < parent.childNodes.length; i++) {
      const child = parent.childNodes[i];
      if (child === container) return length + this.getPositionByNode(node, child);
      if (parent === this.state.ref.current) length += 1;
      length += (child.textContent?.length ?? 0);
    }
    return length;
  };
  
  private getClosestContainer(node: Node, parent: Node): Node {
    if (node.parentElement === null) throw "No parent element exists";
    if (node.parentElement !== parent) return this.getClosestContainer(node.parentElement, parent);
    return node;
  };
  
  public componentDidUpdate(prevProps: Readonly<EditTextProps>, prevState: Readonly<State>, snapshot?: any): void {
    if (prevState.selection !== this.state.selection || prevProps.children.length !== this.props.children.length) {
      const {start, end, forward} = this.state.selection;
      const start_node = this.getNodeByPosition(forward ? start : end);
      const end_node = this.getNodeByPosition(forward ? end : start);
      getSelection()?.setBaseAndExtent(start_node.element, start_node.position, end_node.element, end_node.position);
      this.props.onSelect?.(this.state.selection, this);
    }
  }
  
  public render() {
    const readonly = this.props.readonly ?? true;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    if (this.props.readonly ?? true) classes.push(Style.Readonly);
    
    return (
      <div ref={this.state.ref} className={classes.join(" ")} contentEditable={!readonly} suppressContentEditableWarning={!readonly}
           onBlur={this.eventBlur} onFocus={this.eventFocus} onSelect={this.eventSelect}
           onCopy={this.eventCopy} onPaste={this.eventPaste} onCut={this.eventCut} onKeyDown={this.eventKeyDown} onKeyPress={this.eventKeyPress}>
        {this.renderReactElementList()}
      </div>
    );
  }
  
  private renderReactElementList = (selection?: Selection) => {
    const {start, end} = this.parseSelection(selection);
    const lines = this.getText().slice(start, end).getLines();
    const result = [] as React.ReactNode[];
    
    for (let i = 0; i < lines.length; i++) {
      result.push(<div key={i}>{lines[i].length ? Character.getSegmentList(lines[i]).map(this.renderReactElement) : <br/>}</div>);
    }
    
    return result;
  };
  
  private renderReactElement = ({text, decoration}: {text: Character[], decoration: Decoration}, key: number = 0): React.ReactNode => {
    if (decoration.bold) return <b key={key}>{this.renderReactElement({text, decoration: new Decoration({...decoration, bold: false})})}</b>;
    if (decoration.code) return <code key={key}>{this.renderReactElement({text, decoration: new Decoration({...decoration, code: false})})}</code>;
    if (decoration.mark) return <mark key={key}>{this.renderReactElement({text, decoration: new Decoration({...decoration, mark: false})})}</mark>;
    if (decoration.italic) return <i key={key}>{this.renderReactElement({text, decoration: new Decoration({...decoration, italic: false})})}</i>;
    if (decoration.underline) return <u key={key}>{this.renderReactElement({text, decoration: new Decoration({...decoration, underline: false})})}</u>;
    if (decoration.strikethrough) return <s key={key}>{this.renderReactElement({text, decoration: new Decoration({...decoration, strikethrough: false})})}</s>;
    
    const styling = {} as React.CSSProperties;
    if (decoration.color) styling.color = decoration.color;
    if (decoration.background_color) styling.backgroundColor = decoration.background_color;
    if (decoration.font_family) styling.fontFamily = decoration.font_family;
    if (decoration.font_size) styling.fontSize = decoration.font_size;
    
    return (
      <span key={key} style={styling}>{text.length ? this.renderText(text) : <br/>}</span>
    );
  };
  
  public readonly renderHTML = (selection?: Selection) => {
    const {start, end} = this.parseSelection(selection);
    const lines = this.getText().slice(start, end).getLines();
    const container = document.createElement("div");
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length) container.append(...Character.getSegmentList(lines[i]).map(this.renderHTMLNode));
      if (i + 1 < lines.length) container.append(document.createElement("br"));
    }
    
    return container;
  };
  
  private readonly renderHTMLNode = ({text, decoration}: Segment): Node => {
    if (decoration.bold) return this.appendHTMLNode(document.createElement("b"), {text, decoration: new Decoration({...decoration, bold: false})});
    if (decoration.code) return this.appendHTMLNode(document.createElement("code"), {text, decoration: new Decoration({...decoration, code: false})});
    if (decoration.mark) return this.appendHTMLNode(document.createElement("mark"), {text, decoration: new Decoration({...decoration, mark: false})});
    if (decoration.italic) return this.appendHTMLNode(document.createElement("i"), {text, decoration: new Decoration({...decoration, italic: false})});
    if (decoration.underline) return this.appendHTMLNode(document.createElement("u"), {text, decoration: new Decoration({...decoration, underline: false})});
    if (decoration.strikethrough) return this.appendHTMLNode(document.createElement("s"), {text, decoration: new Decoration({...decoration, strikethrough: false})});
    
    const node = document.createElement("span");
    if (decoration.color) node.style.color = decoration.color;
    if (decoration.background_color) node.style.backgroundColor = decoration.background_color;
    if (decoration.font_family) node.style.fontFamily = decoration.font_family;
    if (decoration.font_size) node.style.fontSize = decoration.font_size;
    node.append(text.length ? document.createTextNode(this.renderText(text)) : document.createElement("br"));
    return node;
  };
  
  private readonly renderText = (list: Character[]) => {
    const text = list.map(char => char.value);
    return text.join("").replace(/(?<!\b)\s(?!\b)?|\s$/g, "\u00A0");
  };
  
  private readonly eventKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    this.insert(event.key);
  };
  
  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    this.props.onKeyDown?.(event, this);
    
    if (!event.defaultPrevented) this.handleKeyDown(event);
    if (!event.bubbles) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  };
  
  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const command = Helper.getKeyboardEventCommand(event);
    event.bubbles = false;
    
    switch (command) {
      case KeyboardCommand.SELECT_ALL:
        return this.select(0, this.props.children.length);
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return this.insert("\n");
      case KeyboardCommand.NEW_PARAGRAPH:
      case KeyboardCommand.NEW_PARAGRAPH_ALT:
        return this.props.onSubmit?.(this);
      case KeyboardCommand.DELETE_FORWARD:
        return this.deleteForward();
      case KeyboardCommand.DELETE_WORD_FORWARD:
        return this.deleteWordForward();
      case KeyboardCommand.DELETE_BACKWARD:
        return this.deleteBackward();
      case KeyboardCommand.DELETE_WORD_BACKWARD:
        return this.deleteWordBackward();
      case KeyboardCommand.REDO:
      case KeyboardCommand.REDO_ALT:
        return this.redo();
      case KeyboardCommand.UNDO:
      case KeyboardCommand.UNDO_ALT:
        return this.undo();
      case KeyboardCommand.BOLD_TEXT:
        return this.decorate({bold: true});
      case KeyboardCommand.ITALIC_TEXT:
        return this.decorate({italic: true});
      case KeyboardCommand.UNDERLINE_TEXT:
        return this.decorate({underline: true});
      case KeyboardCommand.MARK_TEXT:
        return this.decorate({mark: true});
      case KeyboardCommand.CODE_TEXT:
        return this.decorate({code: true});
      case KeyboardCommand.STRIKETHROUGH_TEXT:
        return this.decorate({strikethrough: true});
    }
    
    event.bubbles = true;
  };
  
  private readonly eventBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    this.props.onBlur?.(event, this);
  };
  
  private readonly eventFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    this.props.onFocus?.(event, this);
  };
  
  private readonly eventSelect = (event: React.SyntheticEvent<HTMLElement, MouseEvent | Event>) => {
    const selection = this.getSelection();
    const {start: prev_start, end: prev_end, forward: prev_forward} = selection;
    const {start: next_start, end: next_end, forward: next_forward} = this.state.selection;

    if (next_start !== prev_start || next_end !== prev_end || next_forward !== prev_forward) {
      this.setState({selection});
    }
  };
  
  private readonly eventCopy = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    event.clipboardData.setData("text/plain", this.renderHTML(this.getSelection()).textContent ?? "");
    event.clipboardData.setData("text/html", this.renderHTML(this.getSelection()).innerHTML);
  };
  
  private readonly eventCut = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    event.clipboardData.setData("text/plain", this.renderHTML(this.getSelection()).textContent ?? "");
    event.clipboardData.setData("text/html", this.renderHTML(this.getSelection()).innerHTML);
    this.insertText(new RichText());
  };
  
  private readonly eventPaste = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    if (event.clipboardData.types.includes(ClipboardDataType.FILES)) return;
    if (event.clipboardData.types.includes(ClipboardDataType.TEXT_HTML)) {
      const html = event.clipboardData.getData(ClipboardDataType.TEXT_HTML).match(/<!--StartFragment-->(?<html>.*)<!--EndFragment-->/);
      if (html?.groups?.html) {
        this.template.innerHTML = html.groups.html;
        return this.insertText(RichText.parseHTML(this.template.content));
      }
    }
    
    this.template.innerHTML = event.clipboardData.getData(ClipboardDataType.TEXT_PLAIN);
  };
}

interface Segment {
  text: Character[];
  decoration: Decoration;
}

export type Selection = {start: number, end: number, forward: boolean};
export type EditTextCommand = keyof Initializer<Decoration>;
export type EditTextCommandList = EditTextCommand[];

export interface EditTextProps {
  children: RichText;
  className?: string;
  readonly?: boolean;
  whitelist?: (keyof Initializer<Decoration>)[];
  blacklist?: (keyof Initializer<Decoration>)[];
  
  onBlur?(event: React.FocusEvent<HTMLDivElement>, component: EditText): void;
  onFocus?(event: React.FocusEvent<HTMLDivElement>, component: EditText): void;
  onSelect?(selection: Selection, component: EditText): void;
  onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>, component: EditText): boolean | void;
  
  onChange(text: RichText, component: EditText): void;
  onSubmit?(component: EditText): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
  selection: Selection;
  undo_history: {text: RichText, selection: Selection}[];
  redo_history: {text: RichText, selection: Selection}[];
}
