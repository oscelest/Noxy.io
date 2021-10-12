import React from "react";
import ClipboardDataType from "../../../common/enums/ClipboardDataType";
import Util from "../../../common/services/Util";
import Character from "../../classes/Character";
import Decoration from "../../classes/Decoration";
import RichText, {RichTextSelection} from "../../classes/RichText/RichText";
import RichTextCharacter from "../../classes/RichText/RichTextCharacter";
import RichTextSection from "../../classes/RichText/RichTextSection";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Helper from "../../Helper";
import Component from "../Application/Component";
import Style from "./EditText.module.scss";

export default class EditText extends Component<EditTextProps, State> {
  
  constructor(props: EditTextProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }
  
  public get text() {
    return this.props.children as EditTextProps["children"];
  };
  
  public getSelection(): EditTextSelection | undefined {
    const {focusNode, anchorNode, focusOffset = 0, anchorOffset = 0} = getSelection() ?? {};
    
    if (this.state.ref.current && focusNode && anchorNode && this.state.ref.current.contains(focusNode) && this.state.ref.current.contains(anchorNode)) {
      const [focusSection, focusPosition] = this.getSectionAndCharacterByNode(focusNode, this.state.ref.current, focusOffset);
      const [anchorSection, anchorPosition] = this.getSectionAndCharacterByNode(anchorNode, this.state.ref.current, anchorOffset);
      
      if (anchorSection <= focusSection && anchorPosition <= focusPosition) {
        return {
          start_section:   anchorSection,
          start_character: anchorPosition,
          end_section:     focusSection,
          end_character:   focusPosition,
          forward:         true,
        };
      }
      
      return {
        start_section:   focusSection,
        start_character: focusPosition,
        end_section:     anchorSection,
        end_character:   anchorPosition,
        forward:         false,
      };
    }
  };
  
  private getSectionAndCharacterByNode(node: Node, container: Node, offset: number = 0): [number, number] {
    if (!container || !node.parentNode) throw new Error("Node does not exist inside container element.");
    if (node.parentNode === container) {
      for (let i = 0; i < container.childNodes.length; i++) {
        if (container.childNodes[i] === node) return [offset, i];
      }
    }
    
    const value = this.getSectionAndCharacterByNode(node.parentNode, container);
    for (let i = 0; i < node.parentNode.childNodes.length; i++) {
      const child = node.parentNode.childNodes.item(i);
      if (child === node) break;
      value[0] += child.textContent?.length ?? 0;
    }
    return value;
  }
  
  public insert(insert: RichTextCharacter | RichTextSection | (RichTextCharacter | RichTextSection)[], selection: EditTextSelection) {
    this.props.onChange(this.text.replace(insert, selection), this);
    this.setState({selection});
  };
  
  public isDecorationDisabled(decoration: keyof Initializer<Decoration>) {
    return !!(this.props.whitelist?.length && !this.props.whitelist.includes(decoration) || this.props.blacklist?.includes(decoration));
  };
  
  public focus() {
    this.state.ref.current?.focus();
  }
  
  public select(start_section: number, start_character: number, end_section: number, end_character: number, forward: boolean = true) {
    this.setState({selection: {start_section, end_section, start_character, end_character, forward}});
  };
  
  public insertText(text: string, selection?: EditTextSelection) {
    if (!selection) return;
    
    const decoration = this.text.at(selection.start_section, selection.start_character)?.decoration;
    const segment = [] as RichTextCharacter[];
    
    for (let i = 0; i < text.length; i++) {
      segment.push(new RichTextCharacter(text[i], decoration));
    }
    
    this.insert(segment, selection);
  };
  
  public insertHTML(html: string | HTMLElement, selection?: EditTextSelection) {
    if (!selection) return;
    
    this.insert(RichText.parseHTML(html).value, selection);
  }
  
  public decorate(decoration: Initializer<Decoration>, selection: EditTextSelection) {
    this.props.onChange(this.text.decorate(decoration, selection), this);
    this.setState({selection});
  };
  
  // Should maybe be moved to RichText?
  public deleteForward(selection: EditTextSelection = this.getSelection()) {
    selection = this.parseSelection(selection);
    if (selection.start === this.text.length && selection.end === this.text.length) return;
    if (selection.start === selection.end) selection.end = Math.min(selection.end + 1, this.text.length);
    
    this.insert([], selection);
  };
  
  // Should maybe be moved to RichText?
  public deleteBackward(selection: EditTextSelection = this.getSelection()) {
    selection = this.parseSelection(selection);
    if (!selection.start && !selection.end) return;
    if (selection.start === selection.end) selection.start = Math.max(0, selection.start - 1);
    
    this.insert([], selection);
  };
  
  // Should maybe be moved to RichText?
  public deleteWordForward(selection: EditTextSelection = this.getSelection()) {
    selection = this.parseSelection(selection);
    if (selection.start !== selection.end || selection.end === this.text.length) return this.deleteBackward(selection);
    
    selection.end = this.text.find(/[^\p{Z}]/u, selection.end) ?? this.text.length;
    selection.end = this.text.find(this.text.at(selection.end, true).value.match(/[\p{L}\p{N}]/u) ? /[^\p{L}\p{N}]/u : /[\p{L}\p{N}\p{Z}]/u, selection.end) ?? this.text.length;
    selection.end = this.text.find(/[^\p{Z}]/u, selection.end) ?? this.text.length;
    
    this.insert([], selection);
  }
  
  // Should maybe be moved to RichText?
  public deleteWordBackward(selection: EditTextSelection = this.getSelection()) {
    selection = this.parseSelection(selection);
    if (selection.start !== selection.end || !selection.start) return this.deleteBackward(selection);
    
    selection.start = this.text.find(/[^\p{Z}]/u, selection.start, false) ?? 0;
    selection.start = this.text.find(this.text.at(selection.start, true).value.match(/[\p{L}\p{N}]/u) ? /[^\p{L}\p{N}]/u : /[\p{L}\p{N}\p{Z}]/u, selection.start, false) ?? 0;
    selection.start = this.text.find(/[^\p{Z}]/u, selection.start, false) ?? 0;
    
    this.insert([], {...selection, start: selection.start ? selection.start + 1 : selection.start});
  }
  
  private getNodeByPosition(position: number, parent: Node): {position: number, element: Node} {
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
  
  private getPositionByNode(node: Node, container: Node): number {
    if (node === container) return 0;
    
    
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
  
  public componentDidMount() {
    this.setState({history: this.state.history.push({text: this.text, selection: this.getSelection()})});
  }
  
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
    
    const content = this.text.getContent(0, this.text.length, this.getPosition());
    const children = [] as React.ReactNode[];
    const renderer_line = this.props.rendererLine ?? "div";
    if (!content.length) {
      children.push(Helper.renderReactElementList(Helper.invoke(renderer_line, {start: 0, end: 0, index: 0, value: []}), {key: 0, className: [Style.Line, Style.Empty].join(" ")}));
    }
    else {
      for (let i = 0; i < content.length; i++) {
        const lines = [] as React.ReactNode[];
        for (let j = 0; j < content[i].value.length; j++) {
          lines.push(this.renderReactElement(content[i].value[j], j));
        }
        children.push(Helper.renderReactElementList(Helper.invoke(renderer_line, content[i]), {key: i, className: Style.Line, children: lines}));
      }
    }
    
    const renderer_content = this.props.rendererContent ?? "div";
    return Helper.renderReactElementList(Helper.invoke(renderer_content, content), {
      ref:                            this.state.ref,
      className:                      classes.join(" "),
      contentEditable:                !readonly,
      suppressContentEditableWarning: !readonly,
      onBlur:                         this.eventBlur,
      onFocus:                        this.eventFocus,
      onSelect:                       this.eventSelect,
      onDragStart:                    this.eventDragStart,
      onDrop:                         this.eventDrop,
      onCopy:                         this.eventCopy,
      onPaste:                        this.eventPaste,
      onCut:                          this.eventCut,
      onKeyDown:                      this.eventKeyDown,
      onKeyPress:                     this.eventKeyPress,
      children:                       children,
    });
  }
  
  private renderReactElement = ({decoration, ...segment}: RichTextFragment, i: number = 0): React.ReactNode => {
    if (decoration.bold) return <b key={i}>{this.renderReactElement({...segment, decoration: {...decoration, bold: false}})}</b>;
    if (decoration.code) return <code key={i}>{this.renderReactElement({...segment, decoration: {...decoration, code: false}})}</code>;
    if (decoration.mark) return <mark key={i}>{this.renderReactElement({...segment, decoration: {...decoration, mark: false}})}</mark>;
    if (decoration.italic) return <i key={i}>{this.renderReactElement({...segment, decoration: {...decoration, italic: false}})}</i>;
    if (decoration.underline) return <u key={i}>{this.renderReactElement({...segment, decoration: {...decoration, underline: false}})}</u>;
    if (decoration.strikethrough) return <s key={i}>{this.renderReactElement({...segment, decoration: {...decoration, strikethrough: false}})}</s>;
    if (decoration.link) return <a className={Style.Link} href={decoration.link} key={i}>{this.renderReactElement({...segment, decoration: {...decoration, link: ""}})}</a>;
    
    const classes = [Style.Text] as string[];
    if (decoration.selected && this.props.active !== false) classes.push(Style.Selected);
    
    const renderer_fragment = this.props.rendererFragment ?? "span";
    return Helper.renderReactElementList(Helper.invoke(renderer_fragment, {...segment, decoration}), {
      key:       i,
      className: classes.join(" "),
      style:     new Decoration(decoration).toCSSProperties(),
      children:  segment.text.length ? Helper.renderHTMLText(segment.text) : <br/>,
    });
  };
  
  public readonly renderHTML = (selection?: EditTextSelection) => {
    const {start, end} = this.parseSelection(selection);
    const content = this.text.getContent(start, end, this.getPosition());
    if (!content.length) return this.renderHTMLLine({value: [], index: 0, start: 0, end: 0}, {[RichText.attribute_metadata]: JSON.stringify(this.text.metadata)});
    
    const container = Helper.createElementWithChildren("div");
    for (let i = 0; i < content.length; i++) {
      const line = this.renderHTMLLine(content[i], {[RichText.attribute_metadata]: JSON.stringify(this.text.metadata)});
      for (let j = 0; j < content[i].value.length; j++) {
        line.append(this.renderHTMLNode(content[i].value[j]));
      }
      container.append(line);
    }
    
    return container;
  };
  
  private renderHTMLLine = (line: RichTextLine, attributes: {[key: string]: string} = {}) => {
    return Helper.renderHTMLElementList(Helper.invoke(this.props.subdivision ?? "div", line), attributes);
  };
  
  private readonly renderHTMLNode = ({decoration, ...segment}: RichTextFragment): Node => {
    if (decoration.bold) return Helper.createElementWithChildren("b", {}, this.renderHTMLNode({...segment, decoration: {...decoration, bold: false}}));
    if (decoration.code) return Helper.createElementWithChildren("code", {}, this.renderHTMLNode({...segment, decoration: {...decoration, code: false}}));
    if (decoration.mark) return Helper.createElementWithChildren("mark", {}, this.renderHTMLNode({...segment, decoration: {...decoration, mark: false}}));
    if (decoration.italic) return Helper.createElementWithChildren("i", {}, this.renderHTMLNode({...segment, decoration: {...decoration, italic: false}}));
    if (decoration.underline) return Helper.createElementWithChildren("u", {}, this.renderHTMLNode({...segment, decoration: {...decoration, underline: false}}));
    if (decoration.strikethrough) return Helper.createElementWithChildren("s", {}, this.renderHTMLNode({...segment, decoration: {...decoration, strikethrough: false}}));
    if (decoration.link) return Helper.createElementWithChildren("a", {"href": decoration.link}, this.renderHTMLNode({...segment, decoration: {...decoration, link: ""}}));
    
    const node = new Decoration(decoration).toNode("span");
    node.append(segment.text.length ? document.createTextNode(Helper.renderHTMLText(segment.text)) : document.createElement("br"));
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
      case KeyboardCommand.NEXT_FOCUS:
        return this.insertText(Character.tab);
      case KeyboardCommand.SELECT_ALL:
        return this.select(0, this.props.children.length);
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return this.insertText(Character.linebreak);
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
        return this.decorate({bold: !this.text.hasDecoration("bold", ...this.getPosition())});
      case KeyboardCommand.ITALIC_TEXT:
        return this.decorate({italic: !this.text.hasDecoration("italic", ...this.getPosition())});
      case KeyboardCommand.UNDERLINE_TEXT:
        return this.decorate({underline: !this.text.hasDecoration("underline", ...this.getPosition())});
      case KeyboardCommand.MARK_TEXT:
        return this.decorate({mark: !this.text.hasDecoration("mark", ...this.getPosition())});
      case KeyboardCommand.CODE_TEXT:
        return this.decorate({code: !this.text.hasDecoration("code", ...this.getPosition())});
      case KeyboardCommand.STRIKETHROUGH_TEXT:
        return this.decorate({strikethrough: !this.text.hasDecoration("strikethrough", ...this.getPosition())});
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
    const {start: next_start, end: next_end, forward: next_forward} = this.getSelection();
    const {start: prev_start, end: prev_end, forward: prev_forward} = this.state.selection;
    
    if (next_start !== prev_start || next_end !== prev_end || next_forward !== prev_forward) {
      this.setState({selection: {start: next_start, end: next_end, forward: next_forward}});
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
    event.clipboardData.setData("text/plain", this.renderHTML(this.getSelection()).innerText);
    event.clipboardData.setData("text/html", this.renderHTML(this.getSelection()).innerHTML);
  };
  
  private readonly eventCut = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    event.clipboardData.setData("text/plain", this.renderHTML(this.getSelection()).innerText);
    event.clipboardData.setData("text/html", this.renderHTML(this.getSelection()).innerHTML);
    this.insert([]);
  };
  
  private readonly eventPaste = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    if (event.clipboardData.types.includes(ClipboardDataType.FILES)) return;
    if (event.clipboardData.types.includes(ClipboardDataType.TEXT_HTML)) {
      const html = event.clipboardData.getData(ClipboardDataType.TEXT_HTML).match(/<!--StartFragment-->(?<html>.*)<!--EndFragment-->/);
      if (html?.groups?.html) {
        return this.insertHTML(html.groups.html);
      }
    }
    
    return this.insertText(event.clipboardData.getData(ClipboardDataType.TEXT_PLAIN));
  };
}

interface EditTextSelection extends RichTextSelection {
  forward: boolean;
}

export type EditTextElement = keyof HTMLElementTagNameMap | (keyof HTMLElementTagNameMap)[]
export type EditTextCommand = keyof Initializer<Decoration>;
export type EditTextCommandList = EditTextCommand[];

export interface EditTextProps {
  active?: boolean;
  children: RichText;
  className?: string;
  readonly?: boolean;
  whitelist?: (keyof Initializer<Decoration>)[];
  blacklist?: (keyof Initializer<Decoration>)[];
  
  onBlur?(event: React.FocusEvent<HTMLDivElement>, component: EditText): void;
  onFocus?(event: React.FocusEvent<HTMLDivElement>, component: EditText): void;
  onSelect?(selection: EditTextSelection, component: EditText): void;
  onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>, component: EditText): boolean | void;
  
  onChange(text: RichText, component: EditText): void;
  onSubmit?(component: EditText): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
  selection?: EditTextSelection;
}
