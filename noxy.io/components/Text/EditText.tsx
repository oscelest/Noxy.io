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
  
  private static keyboard_command_collection: { [K in KeyboardCommand]?: EditTextKeyboardCommandFunction[] } = {
    [KeyboardCommand.BOLD_TEXT]:            [EditText.eventDecorateBold],
    [KeyboardCommand.ITALIC_TEXT]:          [EditText.eventDecorateItalic],
    [KeyboardCommand.UNDERLINE_TEXT]:       [EditText.eventDecorateUnderline],
    [KeyboardCommand.CODE_TEXT]:            [EditText.eventDecorateCode],
    [KeyboardCommand.MARK_TEXT]:            [EditText.eventDecorateMark],
    [KeyboardCommand.STRIKETHROUGH_TEXT]:   [EditText.eventDecorateStrikethrough],
    
    [KeyboardCommand.SELECT_ALL]:           [EditText.eventSelectAll],
    
    [KeyboardCommand.NEW_LINE]:             [EditText.eventNewLine],
    [KeyboardCommand.NEW_LINE_ALT]:         [EditText.eventNewLine],
    [KeyboardCommand.NEW_PARAGRAPH]:        [EditText.eventNewParagraph],
    [KeyboardCommand.NEW_PARAGRAPH_ALT]:    [EditText.eventNewParagraph],
    
    [KeyboardCommand.UNDO]:                 [EditText.eventUndo],
    [KeyboardCommand.UNDO_ALT]:             [EditText.eventUndo],
    [KeyboardCommand.REDO]:                 [EditText.eventRedo],
    [KeyboardCommand.REDO_ALT]:             [EditText.eventRedo],

    [KeyboardCommand.DELETE_FORWARD]:       [EditText.eventDeleteForward],
    [KeyboardCommand.DELETE_WORD_FORWARD]:  [EditText.eventDeleteWordForward],
    
    [KeyboardCommand.DELETE_BACKWARD]:      [EditText.eventDeleteBackward],
    [KeyboardCommand.DELETE_WORD_BACKWARD]: [EditText.eventDeleteWordBackward],
  };
  
  constructor(props: EditTextProps) {
    super(props);
    this.state = {
      ref:          React.createRef(),
      selection:    [0, 0],
      redo_history: [],
      undo_history: [],
    };
  }
  
  private static eventDecorateStrikethrough( component: EditText) {
    return component.decorate({strikethrough: true});
  }
  
  private static eventDecorateBold( component: EditText) {
    return component.decorate({bold: true});
  }
  
  private static eventDecorateCode( component: EditText) {
    return component.decorate({code: true});
  }
  
  private static eventDecorateMark( component: EditText) {
    return component.decorate({mark: true});
  }
  
  private static eventDecorateItalic( component: EditText) {
    return component.decorate({italic: true});
  }
  
  private static eventDecorateUnderline( component: EditText) {
    return component.decorate({underline: true});
  }
  
  private static eventSelectAll( component: EditText) {
    return component.select(0, component.props.children.length);
  }
  
  private static eventNewLine( component: EditText) {
    return component.insert("\n");
  }
  
  private static eventNewParagraph( component: EditText) {
    return component.props.onSubmit?.(component.props.children);
  }
  
  private static eventDeleteForward( component: EditText) {
    return component.deleteForward();
  }
  
  private static eventDeleteBackward( component: EditText) {
    return component.deleteBackward();
  }
  
  private static eventDeleteWordForward( component: EditText) {
    return component.deleteWordForward();
  }
  
  private static eventDeleteWordBackward( component: EditText) {
    return component.deleteWordBackward();
  }
  
  private static eventRedo( component: EditText) {
    return component.redo();
  }
  
  private static eventUndo( component: EditText) {
    return component.undo();
  }
  
  public readonly insert = (character: string, [start, end]: [number, number] = this.getSelection()) => {
    if (character.length !== 1) throw "Insert string must be a single character.";
    this.insertText(new Character(character, this.getText().getCharacter(Math.max(0, start - 1))?.decoration), [start, end]);
  };
  
  public readonly decorate = (decoration: Initializer<Decoration>, [start, end]: [number, number] = this.getSelection()) => {
    start = Math.min(start, end);
    end = Math.max(start, end);
    
    let text = this.getText().slice(start, end);
    const keys = Util.getProperties(decoration);
    
    for (let i = 0; i < keys.length; i++) {
      text = text.applyDecoration(keys[i], text.hasDecoration(keys[i]) ? undefined : decoration[keys[i]]);
    }
    
    this.insertText(text, [start, end], false);
  };
  
  public readonly deleteForward = ([start, end]: [number, number] = this.getSelection()) => {
    if (start === this.getText().length && end === this.getText().length) return;
    if (start === end) end = Math.min(end + 1, this.getText().length);
    
    this.insertText(new RichText(), [start, end]);
  };
  
  public readonly deleteBackward = ([start, end]: [number, number] = this.getSelection()) => {
    if (!start && !end) return;
    if (start === end) start = Math.max(0, start - 1);
    
    this.insertText(new RichText(), [start, end]);
  };
  
  public readonly select = (start: number, end: number) => {
    const start_node = this.getNodeByPosition(Math.min(start, end));
    const end_node = this.getNodeByPosition(Math.max(start, end));
    getSelection()?.setBaseAndExtent(start_node.element, start_node.position, end_node.element, end_node.position);
  };
  
  public deleteWordForward([start, end]: [number, number] = this.getSelection()) {
    if (start !== end || end === this.getText().length) return this.deleteBackward([start, end]);
    
    end = this.find(/[^\p{Z}]/u, end) ?? this.getText().length;
    end = this.find(this.getText().getCharacterSafe(end).value.match(/[\p{L}\p{N}]/u) ? /[^\p{L}\p{N}]/u : /[\p{L}\p{N}\p{Z}]/u, end) ?? this.getText().length;
    end = this.find(/[^\p{Z}]/u, end) ?? this.getText().length;
    
    this.insertText(new RichText(), [start, end]);
  }
  
  public deleteWordBackward([start, end]: [number, number] = this.getSelection()) {
    if (start !== end || !start) return this.deleteBackward([start, end]);
    
    start = this.find(/[^\p{Z}]/u, start, false) ?? 0;
    start = this.find(this.getText().getCharacterSafe(start).value.match(/[\p{L}\p{N}]/u) ? /[^\p{L}\p{N}]/u : /[\p{L}\p{N}\p{Z}]/u, start, false) ?? 0;
    start = this.find(/[^\p{Z}]/u, start, false) ?? 0;
    
    this.insertText(new RichText(), [start ? start + 1 : start, end]);
  }
  
  public undo() {
    const item = this.state.undo_history[this.state.undo_history.length - 1];
    if (!item) return this;
    
    this.props.onChange(item.text, this.props.children);
    this.setState({
      selection:    item.selection,
      redo_history: [...this.state.redo_history, {text: this.props.children, selection: this.getSelection()}],
      undo_history: this.state.undo_history.slice(0, this.state.undo_history.length - 1),
    });
  }
  
  public redo() {
    const item = this.state.redo_history[this.state.redo_history.length - 1];
    if (!item) return this;
    
    this.props.onChange(item.text, this.props.children);
    this.setState({
      selection:    item.selection,
      redo_history: this.state.redo_history.slice(0, this.state.redo_history.length - 1),
      undo_history: [...this.state.undo_history, {text: this.props.children, selection: this.getSelection()}],
    });
  }
  
  private readonly insertText = (insert: Character | Character[] | RichText, selection: [number, number] = this.getSelection(), clear_selection = true) => {
    const length = insert instanceof Character ? 1 : insert.length;
    const text = this.getText().insert(insert, selection);
    const next_selection = clear_selection ? [selection[0] + length, selection[0] + length] as [number, number] : selection;
    
    this.props.onChange(text, this.props.children);
    this.setState({selection: next_selection, redo_history: [], undo_history: [...this.state.undo_history, {text: this.props.children, selection}]});
  };
  
  private readonly find = (regex: RegExp, position: number, forward: boolean = true): number | undefined => {
    position = forward ? position : position - 1;
    const character = this.getText().getCharacter(position);
    if (!character) return undefined;
    return character.value.match(regex) ? position : this.find(regex, forward ? position + 1 : position, forward);
  };
  
  private readonly appendHTMLNode = (node: Node, segment: Segment) => {
    node.appendChild(this.renderHTMLNode(segment));
    return node;
  };
  
  private readonly parseSelection = (selection?: [number, number]): [number, number] => {
    if (!selection) return [0, this.getText().length];
    if (isNaN(+selection[0])) selection[0] = 0;
    if (isNaN(+selection[1])) selection[1] = this.getText().length;
    
    selection[0] = Math.max(Math.min(selection[0], selection[1]), 0);
    selection[1] = Math.min(Math.max(selection[0], selection[1]), this.getText().length);
    return selection;
  };
  
  private readonly getSelection = (): [number, number] => {
    const selection = getSelection();
    if (!selection || !selection.focusNode || !selection.anchorNode) throw "Could not get selection.";
    if (!this.state.ref.current) throw "Could not get reference element.";
    
    const focus_node = selection.focusNode;
    const anchor_node = selection.anchorNode;
    const focus_offset = selection.focusOffset;
    const anchor_offset = selection.anchorOffset;
    
    const focus_position = this.getPositionByNode(focus_node) + focus_offset;
    const anchor_position = this.getPositionByNode(anchor_node) + anchor_offset;
    
    return [Math.max(0, Math.min(focus_position, anchor_position)), Math.min(Math.max(focus_position, anchor_position), this.props.children.length)];
  };
  
  private readonly getNodeByPosition = (position: number, parent: Node | null = this.state.ref.current): {position: number, element: Node} => {
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
  
  private readonly getPositionByNode = (node: Node, parent: Node | null = this.state.ref.current): number => {
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
  
  private readonly getClosestContainer = (node: Node, parent: Node): Node => {
    if (node.parentElement === null) throw "No parent element exists";
    if (node.parentElement !== parent) return this.getClosestContainer(node.parentElement, parent);
    return node;
  };
  
  private readonly getText = () => {
    return this.props.children;
  };
  
  public componentDidUpdate(prevProps: Readonly<EditTextProps>, prevState: Readonly<State>, snapshot?: any): void {
    if (prevState.selection !== this.state.selection || prevProps.children.length !== this.props.children.length) {
      const [start, end] = this.state.selection;
      const start_node = this.getNodeByPosition(start);
      const end_node = this.getNodeByPosition(end);
      getSelection()?.setBaseAndExtent(start_node.element, start_node.position, end_node.element, end_node.position);
    }
  }
  
  public render() {
    const readonly = this.props.readonly ?? true;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    if (this.props.readonly ?? true) classes.push(Style.Readonly);
    
    return (
      <div ref={this.state.ref} className={classes.join(" ")} contentEditable={!readonly} suppressContentEditableWarning={!readonly}
           onBlur={this.eventBlur} onFocus={this.eventFocus}
           onCopy={this.eventCopy} onPaste={this.eventPaste} onCut={this.eventCut} onKeyDown={this.eventKeyDown} onKeyPress={this.eventKeyPress}>
        {this.renderReactElementList()}
      </div>
    );
  }
  
  private readonly renderReactElementList = (selection?: [number, number]) => {
    const lines = this.getText().slice(...this.parseSelection(selection)).getLines();
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
  
  public readonly renderHTML = (selection?: [number, number]) => {
    const lines = this.getText().slice(...this.parseSelection(selection)).getLines();
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
    if (!this.handleKeyDown(event)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  };
  
  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const command = Helper.getKeyboardEventCommand(event);
    const function_list = EditText.keyboard_command_collection[command];
    if (!function_list) return true;
    
    for (let i = 0; i < function_list.length; i++) {
      if (function_list[i](this, event, command) !== false) return false;
    }
    
    return true;
  };
  
  
  private readonly eventBlur = () => {
    this.props.onBlur?.(this.props.children);
  };
  
  private readonly eventFocus = () => {
    this.props.onFocus?.(this.props.children);
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

export type EditTextKeyboardCommandFunction = (component: EditText, event: React.KeyboardEvent<HTMLDivElement>, command: KeyboardCommand) => any

interface Segment {
  text: Character[];
  decoration: Decoration;
}

export interface EditTextProps {
  id?: string;
  children: RichText;
  
  className?: string;
  readonly?: boolean;
  
  onBlur?(text: RichText): void;
  onFocus?(text: RichText): void;
  onChange(new_text: RichText, old_text: RichText): void;
  onSubmit?(text: RichText): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
  selection: [number, number];
  undo_history: {text: RichText, selection: [number, number]}[];
  redo_history: {text: RichText, selection: [number, number]}[];
}
