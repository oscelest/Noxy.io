import React from "react";
import ClipboardDataType from "../../../common/enums/ClipboardDataType";
import Util from "../../../common/services/Util";
import Character from "../../classes/Character";
import Decoration from "../../classes/Decoration";
import History from "../../classes/History";
import RichText from "../../classes/RichText";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Helper from "../../Helper";
import Component from "../Application/Component";
import Style from "./EditText.module.scss";

export default class EditText<V = never> extends Component<EditTextProps<V>, State<V>> {
  
  #template: HTMLTemplateElement;
  
  constructor(props: EditTextProps<V>) {
    super(props);
    this.#template = document.createElement("template");
    this.state = {
      ref:       React.createRef(),
      history:   new History(),
      selection: {start: 0, end: 0, forward: true},
    };
  }
  
  public get text() {
    return this.props.children as EditTextProps<V>["children"];
  };
  
  public getSelection(): Selection {
    const selection = getSelection();
    if (!this.state.ref.current || !selection || !selection.focusNode || !selection.anchorNode) return this.state.selection;
    
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
  
  public getDecoration(start: number, end: number): Decoration {
    if (start === 0 && end === 0) return new Decoration();
    
    let initializer = this.text.at(start, true).decoration;
    for (let i = start + 1; i < end; i++) {
      initializer = initializer.getIntersection(this.text.at(i, true).decoration);
    }
    
    return new Decoration(initializer);
  }
  
  public hasDecoration(property: keyof Initializer<Decoration>, selection: Selection = this.getSelection()) {
    const {start, end} = this.parseSelection(selection);
    for (let i = start; i < end; i++) {
      if (!this.text.at(i, true).decoration[property]) {
        return false;
      }
    }
    return true;
  }
  
  public isDecorationDisabled(decoration: keyof Initializer<Decoration>) {
    return !!(this.props.whitelist?.length && !this.props.whitelist.includes(decoration) || this.props.blacklist?.includes(decoration));
  };
  
  public focus() {
    this.state.ref.current?.focus();
  }
  
  public select(start: number = 0, end: number = this.text.length, forward: boolean = true) {
    this.setState({selection: {start, end, forward}});
  };
  
  public insert(insert: Character | Character[], selection: Selection = this.getSelection(), clear_selection = true) {
    selection = this.parseSelection(selection);
    
    const length = insert instanceof Character ? 1 : insert.length;
    const start = this.text.slice(0, selection.start);
    const end = this.text.slice(selection.end);
    const next_text = new RichText({...this.text, value: [start, insert, end]});
    const next_selection = clear_selection ? {start: selection.start + length, end: selection.start + length, forward: selection.forward} : selection;
    
    this.props.onChange(next_text, this);
    this.setState({selection: next_selection, history: this.state.history.push({text: next_text, selection: next_selection})});
  };
  
  public insertText(text: string, selection: Selection = this.getSelection()) {
    const position = Math.max(0, selection.start - 1);
    const decoration = this.text.at(position)?.decoration;
    const segment = [] as Character[];
    
    for (let i = 0; i < text.length; i++) {
      segment.push(new Character(text[i], decoration));
    }
    
    this.insert(segment, selection);
  };
  
  public insertHTML(html: Node, selection: Selection = this.getSelection()) {
    this.insert(Character.parseHTML(html), selection);
  }
  
  public decorate(decoration: Initializer<Decoration>, selection: Selection = this.getSelection()) {
    decoration = {...decoration};
    selection = this.parseSelection(selection);
    
    const entries = Util.getProperties(decoration);
    for (let i = 0; i < entries.length; i++) {
      const key = entries[i];
      if (this.props.whitelist?.length && !this.props.whitelist.includes(key) || this.props.blacklist?.includes(key)) {
        delete decoration[key];
      }
    }
    
    const text = this.text.slice(selection.start, selection.end);
    for (let i = 0; i < text.length; i++) {
      text[i] = text[i].decorate(decoration);
    }
    
    this.insert(text, selection, false);
  };
  
  public deleteForward(selection: Selection = this.getSelection()) {
    if (selection.start === this.text.length && selection.end === this.text.length) return;
    if (selection.start === selection.end) selection.end = Math.min(selection.end + 1, this.text.length);
    
    this.insert([], selection);
  };
  
  public deleteBackward(selection: Selection = this.getSelection()) {
    if (!selection.start && !selection.end) return;
    if (selection.start === selection.end) selection.start = Math.max(0, selection.start - 1);
    
    this.insert([], selection);
  };
  
  public deleteWordForward(selection: Selection = this.getSelection()) {
    if (selection.start !== selection.end || selection.end === this.text.length) return this.deleteBackward(selection);
    
    selection.end = this.find(/[^\p{Z}]/u, selection.end) ?? this.text.length;
    selection.end = this.find(this.text.at(selection.end, true).value.match(/[\p{L}\p{N}]/u) ? /[^\p{L}\p{N}]/u : /[\p{L}\p{N}\p{Z}]/u, selection.end) ?? this.text.length;
    selection.end = this.find(/[^\p{Z}]/u, selection.end) ?? this.text.length;
    
    this.insert([], selection);
  }
  
  public deleteWordBackward(selection: Selection = this.getSelection()) {
    if (selection.start !== selection.end || !selection.start) return this.deleteBackward(selection);
    
    selection.start = this.find(/[^\p{Z}]/u, selection.start, false) ?? 0;
    selection.start = this.find(this.text.at(selection.start, true).value.match(/[\p{L}\p{N}]/u) ? /[^\p{L}\p{N}]/u : /[\p{L}\p{N}\p{Z}]/u, selection.start, false) ?? 0;
    selection.start = this.find(/[^\p{Z}]/u, selection.start, false) ?? 0;
    
    this.insert([], {...selection, start: selection.start ? selection.start + 1 : selection.start});
  }
  
  public undo() {
    const history = this.state.history.backward();
    if (this.state.history === history) return this;
    
    this.props.onChange(history.value.text, this);
    this.setState({history, selection: history.value.selection});
  }
  
  public redo() {
    const history = this.state.history.forward();
    if (this.state.history === history) return this;
    
    this.props.onChange(history.value.text, this);
    this.setState({history, selection: history.value.selection});
  }
  
  private find(regex: RegExp, position: number, forward: boolean = true): number | undefined {
    position = forward ? position : position - 1;
    const character = this.text.at(position);
    if (!character) return undefined;
    return character.value.match(regex) ? position : this.find(regex, forward ? position + 1 : position, forward);
  };
  
  private parseSelection(selection?: Selection): Selection {
    if (!selection) return {start: 0, end: this.text.length, forward: true};
    if (isNaN(+selection.start)) selection.start = 0;
    if (isNaN(+selection.end)) selection.end = this.text.length;
    
    selection.start = Math.max(Math.min(selection.start, selection.end), 0);
    selection.end = Math.min(Math.max(selection.start, selection.end), this.text.length);
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
    const container = Helper.getClosestContainer(node, parent);
    
    let length = 0;
    for (let i = 0; i < parent.childNodes.length; i++) {
      const child = parent.childNodes[i];
      if (child === container) return length + this.getPositionByNode(node, child);
      if (parent === this.state.ref.current) length += 1;
      length += (child.textContent?.length ?? 0);
    }
    return length;
  };
  
  private getSegmentCollection({start, end}: Selection) {
    const selection = this.getSelection();
    const segment_collection = [] as {text: string, decoration: Decoration}[][];
    if (!this.text.at(start) || !this.text.at(end - 1)) return segment_collection;
    
    let position: number = start;
    let character: Character = this.text.at(position, true);
    let decoration: Decoration = selection.start <= position && selection.end > position ? new Decoration({...character.decoration, selected: true}) : character.decoration;
    segment_collection.push([{text: "", decoration}]);
    
    do {
      const segment_list = segment_collection[segment_collection.length - 1];
      const segment = segment_list[segment_list.length - 1];
      decoration = selection.start <= position && selection.end > position ? new Decoration({...character.decoration, selected: true}) : character.decoration;
      
      if (character.value === "\n") {
        segment_collection.push([{text: "", decoration}]);
      }
      else if (!segment?.decoration.equals(decoration)) {
        segment_list.push({text: character.value, decoration});
      }
      else {
        segment.text += character.value;
      }
    }
    while (++position < end && (character = this.text.at(position, true)));
    
    return segment_collection;
  }
  
  public componentDidMount() {
    this.setState({history: this.state.history.push({text: this.text, selection: this.getSelection()})});
  }
  
  public componentDidUpdate(prevProps: Readonly<EditTextProps<V>>, prevState: Readonly<State<V>>, snapshot?: any): void {
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
           onDragStart={this.eventDragStart} onDrop={this.eventDrop} onCopy={this.eventCopy} onPaste={this.eventPaste} onCut={this.eventCut}
           onKeyDown={this.eventKeyDown} onKeyPress={this.eventKeyPress}>
        {this.renderReactElementList()}
      </div>
    );
  }
  
  private renderReactElementList = (selection?: Selection) => {
    const segment_collection = this.getSegmentCollection(this.parseSelection(selection));
    const result = [] as React.ReactNode[];
    
    for (let i = 0; i < segment_collection.length; i++) {
      const children = [] as React.ReactNode[];
      for (let j = 0; j < segment_collection[i].length; j++) {
        const {text, decoration} = segment_collection[i][j];
        children.push(this.renderReactElement(text, decoration, j));
      }
      result.push(<div className={Style.Line} key={i}>{children}</div>);
    }
    
    return result;
  };
  
  private renderReactElement = (text: string, decoration: Decoration, key: number = 0): React.ReactNode => {
    if (decoration.bold) return <b key={key}>{this.renderReactElement(text, new Decoration({...decoration, bold: false}))}</b>;
    if (decoration.code) return <code key={key}>{this.renderReactElement(text, new Decoration({...decoration, code: false}))}</code>;
    if (decoration.mark) return <mark key={key}>{this.renderReactElement(text, new Decoration({...decoration, mark: false}))}</mark>;
    if (decoration.italic) return <i key={key}>{this.renderReactElement(text, new Decoration({...decoration, italic: false}))}</i>;
    if (decoration.underline) return <u key={key}>{this.renderReactElement(text, new Decoration({...decoration, underline: false}))}</u>;
    if (decoration.strikethrough) return <s key={key}>{this.renderReactElement(text, new Decoration({...decoration, strikethrough: false}))}</s>;
    if (decoration.link) return <a className={Style.Link} href={decoration.link} key={key}>{this.renderReactElement(text, new Decoration({...decoration, link: ""}))}</a>;
    
    const classes = [Style.Text] as string[];
    if (decoration.selected) classes.push(Style.Selected);
    
    return (
      <span key={key} className={classes.join(" ")} style={decoration.toCSSProperties()}>{text.length ? Helper.renderHTMLText(text) : <br/>}</span>
    );
  };
  
  public readonly renderHTML = (selection?: Selection) => {
    const segment_collection = this.getSegmentCollection(this.parseSelection(selection));
    const container = document.createElement("div");
    container.setAttribute(RichText.attribute_metadata, JSON.stringify(this.text.metadata));
    
    for (let i = 0; i < segment_collection.length; i++) {
      if (i !== 0) container.append(document.createElement("br"));
      for (let j = 0; j < segment_collection[i].length; j++) {
        const {text, decoration} = segment_collection[i][j];
        container.append(this.renderHTMLNode(text, decoration));
      }
    }
    
    return container;
  };
  
  private readonly renderHTMLNode = (text: string, decoration: Decoration): Node => {
    if (decoration.bold) return Helper.createElementWithChildren("b", {}, this.renderHTMLNode(text, new Decoration({...decoration, bold: false})));
    if (decoration.code) return Helper.createElementWithChildren("code", {}, this.renderHTMLNode(text, new Decoration({...decoration, code: false})));
    if (decoration.mark) return Helper.createElementWithChildren("mark", {}, this.renderHTMLNode(text, new Decoration({...decoration, mark: false})));
    if (decoration.italic) return Helper.createElementWithChildren("i", {}, this.renderHTMLNode(text, new Decoration({...decoration, italic: false})));
    if (decoration.underline) return Helper.createElementWithChildren("u", {}, this.renderHTMLNode(text, new Decoration({...decoration, underline: false})));
    if (decoration.strikethrough) return Helper.createElementWithChildren("s", {}, this.renderHTMLNode(text, new Decoration({...decoration, strikethrough: false})));
    if (decoration.link) return Helper.createElementWithChildren("a", {"href": decoration.link}, this.renderHTMLNode(text, new Decoration({...decoration, link: ""})));
  
    const node = decoration.toNode("span");
    node.append(text.length ? document.createTextNode(Helper.renderHTMLText(text)) : document.createElement("br"));
    return node;
  };
  
  private readonly eventKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    this.insertText(event.key);
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
        return this.insertText("\n");
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
        return this.decorate({bold: !this.hasDecoration("bold")});
      case KeyboardCommand.ITALIC_TEXT:
        return this.decorate({italic: !this.hasDecoration("italic")});
      case KeyboardCommand.UNDERLINE_TEXT:
        return this.decorate({underline: !this.hasDecoration("underline")});
      case KeyboardCommand.MARK_TEXT:
        return this.decorate({mark: !this.hasDecoration("mark")});
      case KeyboardCommand.CODE_TEXT:
        return this.decorate({code: !this.hasDecoration("code")});
      case KeyboardCommand.STRIKETHROUGH_TEXT:
        return this.decorate({strikethrough: !this.hasDecoration("strikethrough")});
    }
    
    event.bubbles = true;
  };
  
  private readonly eventBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    this.props.onBlur?.(event, this);
  };
  
  private readonly eventFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    this.props.onFocus?.(event, this);
  };
  
  private readonly eventSelect = () => {
    const selection = this.getSelection();
    const {start: prev_start, end: prev_end, forward: prev_forward} = selection;
    const {start: next_start, end: next_end, forward: next_forward} = this.state.selection;
    
    if (next_start !== prev_start || next_end !== prev_end || next_forward !== prev_forward) {
      this.setState({selection});
    }
  };
  
  private readonly eventDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  
  private readonly eventDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
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
    this.insert([]);
  };
  
  private readonly eventPaste = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    if (event.clipboardData.types.includes(ClipboardDataType.FILES)) return;
    if (event.clipboardData.types.includes(ClipboardDataType.TEXT_HTML)) {
      const html = event.clipboardData.getData(ClipboardDataType.TEXT_HTML).match(/<!--StartFragment-->(?<html>.*)<!--EndFragment-->/);
      if (html?.groups?.html) {
        this.#template.innerHTML = html.groups.html;
        return this.insert(Character.parseHTML(this.#template.content));
      }
    }
    
    this.#template.innerHTML = event.clipboardData.getData(ClipboardDataType.TEXT_PLAIN);
  };
}

export type Selection = {start: number, end: number, forward: boolean};
export type EditTextCommand = keyof Initializer<Decoration>;
export type EditTextCommandList = EditTextCommand[];

export interface EditTextProps<V> {
  children: RichText<V>;
  className?: string;
  readonly?: boolean;
  whitelist?: (keyof Initializer<Decoration>)[];
  blacklist?: (keyof Initializer<Decoration>)[];
  
  onBlur?(event: React.FocusEvent<HTMLDivElement>, component: EditText<V>): void;
  onFocus?(event: React.FocusEvent<HTMLDivElement>, component: EditText<V>): void;
  onSelect?(selection: Selection, component: EditText<V>): void;
  onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>, component: EditText<V>): boolean | void;
  
  onChange(text: RichText<V>, component: EditText<V>): void;
  onSubmit?(component: EditText<V>): void;
}

interface State<V> {
  ref: React.RefObject<HTMLDivElement>;
  history: History<{text: RichText<V>, selection: Selection}>;
  selection: Selection;
}
