import React from "react";
import Style from "./EditText.module.scss";
import Component from "../Application/Component";
import Character from "../../classes/Character";
import Decoration from "../../classes/Decoration";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Helper from "../../Helper";
import Util from "../../../common/services/Util";
import ClipboardDataType from "../../../common/enums/ClipboardDataType";

export default class EditText extends Component<EditTextProps, State> {

  private template: HTMLTemplateElement = document.createElement("template");

  constructor(props: EditTextProps) {
    super(props);
    this.state = {
      ref:       React.createRef(),
      selection: [0, 0],
    };
  }

  public readonly insert = (character: string, [start, end]: [number, number] = this.getSelection()) => {
    if (character.length !== 1) throw "Insert string must be a single character.";
    const decoration = this.props.children[start - 1]?.decoration ?? new Decoration();
    this.insertText(new Character(character, decoration), [start, end]);
    this.setState({selection: [start + 1, start + 1]});
  };

  public readonly decorate = (decoration: Initializer<Decoration>, [start, end]: [number, number] = this.getSelection()) => {
    start = Math.min(start, end);
    end = Math.max(start, end);
    const text = this.props.children.slice(Math.max(0, start), Math.min(end, this.props.children.length));
    const keys = Util.getProperties(decoration);
    for (let i = 0; i < keys.length; i++) {
      Character.applyDecoration(text, keys[i], Character.hasDecoration(text, keys[i]) ? undefined : decoration[keys[i]]);
    }
    this.insertText(text, [start, end]);
    this.setState({selection: [start, end]});
  };

  public readonly deleteForward = () => {
    let [start, end] = this.getSelection();
    if (start === end) end = Math.min(end + 1, this.props.children.length);
    this.insertText([], [start, end]);
  };

  public readonly deleteBackward = () => {
    let [start, end] = this.getSelection();
    if (start === end) start = Math.max(0, start - 1);
    this.insertText([], [start, end]);
  };

  public readonly select = (start: number, end: number) => {
    const start_node = this.getNodeByPosition(Math.min(start, end));
    const end_node = this.getNodeByPosition(Math.max(start, end));
    getSelection()?.setBaseAndExtent(start_node.element, start_node.position, end_node.element, end_node.position);
  };

  public deleteWordForward() {
    let [start, end] = this.getSelection();
    if (start !== end) return this.deleteForward();

    let character = this.props.children[end]?.value;
    if (!character) return;

    const regex = character.match(/[\p{L}\p{N}]/u) ? /[\p{L}\p{N}]/u : /[^\p{L}\p{N}\p{Z}]/u;
    if (character.match(/\p{Z}/u)) while (this.props.children[end].value.match(/\p{Z}/u)) character = this.props.children[++end]?.value;

    while (character?.match(regex)) character = this.props.children[++end]?.value
    while (character?.match(/\p{Z}/u)) character = this.props.children[++end]?.value
    this.insertText([], [start, end]);
  }

  public deleteWordBackward() {
    let [start, end] = this.getSelection();
    if (start !== end) return this.deleteBackward();

    let character = this.props.children[--start]?.value;
    if (!character) return;

    const regex = character.match(/[\p{L}\p{N}]/u) ? /[\p{L}\p{N}]/u : /[^\p{L}\p{N}\p{Z}]/u;
    if (character.match(/\p{Z}/u)) while (character?.match(/\p{Z}/u)) character = this.props.children[--start]?.value;

    while (character?.match(regex)) character = this.props.children[--start]?.value;
    while (character?.match(/\p{Z}/u)) character = this.props.children[--start]?.value;
    this.insertText([], [start + 1, end]);
  }

  private readonly appendHTMLNode = (node: Node, segment: Segment) => {
    node.appendChild(this.renderHTMLNode(segment));
    return node;
  };

  private readonly parseSelection = (selection?: [number, number]): [number, number] => {
    if (!selection) return [0, this.getTextLength()];
    if (isNaN(+selection[0])) selection[0] = 0;
    if (isNaN(+selection[1])) selection[1] = this.getTextLength();

    selection[0] = Math.max(Math.min(selection[0], selection[1]), 0);
    selection[1] = Math.min(Math.max(selection[0], selection[1]), this.getTextLength());
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

    return [Math.min(focus_position, anchor_position), Math.max(focus_position, anchor_position)];
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

  private readonly insertText = (text: Character | Character[] = [], [start, end]: [number, number] = this.getSelection()) => {
    text = Array.isArray(text) ? text : [text];
    this.props.onChange([...this.props.children.slice(0, start), ...text, ...this.props.children.slice(end)], this.props.children);
    this.setState({selection: [start + text.length, start + text.length]});
  };

  private readonly getTextLength = () => {
    return this.props.children.length ?? 0;
  };

  public componentDidMount(): void {
    // window.addEventListener("mouseup", this.eventMouseUp);
  }

  public componentDidUpdate(prevProps: Readonly<EditTextProps>, prevState: Readonly<State>, snapshot?: any): void {
    if (prevState.selection !== this.state.selection || prevProps.children.length !== this.props.children.length) {
      const [start, end] = this.state.selection;
      const start_node = this.getNodeByPosition(start);
      const end_node = this.getNodeByPosition(end);
      getSelection()?.setBaseAndExtent(start_node.element, start_node.position, end_node.element, end_node.position);
    }
  }

  public componentWillUnmount(): void {
    // window.removeEventListener("mouseup", this.eventMouseUp);
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div ref={this.state.ref} className={classes.join(" ")} contentEditable={true} suppressContentEditableWarning={true}
           onCopy={this.eventCopy} onPaste={this.eventPaste} onCut={this.eventCut} onKeyDown={this.eventKeyDown} onKeyPress={this.eventKeyPress}>
        {this.renderReactElementList()}
      </div>
    );
  }

  private readonly renderReactElementList = (selection?: [number, number]) => {
    const lines = Character.getLines(this.props.children.slice(...this.parseSelection(selection)));
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
    const lines = Character.getLines(this.props.children.slice(...this.parseSelection(selection)));
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
    if (this.handleKeyDown(event) !== true) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  };

  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (Helper.getKeyboardEventCommand(event)) {
      case KeyboardCommand.SELECT_ALL:
        return this.select(0, this.props.children.length);
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return this.insert("\n");
      case KeyboardCommand.NEW_PARAGRAPH:
      case KeyboardCommand.NEW_PARAGRAPH_ALT:
        return this.props.onSubmit?.(this.props.children);
      case KeyboardCommand.DELETE_FORWARD:
        return this.deleteForward();
      case KeyboardCommand.DELETE_WORD_FORWARD:
        return this.deleteWordForward();
      case KeyboardCommand.DELETE_BACKWARD:
        return this.deleteBackward();
      case KeyboardCommand.DELETE_WORD_BACKWARD:
        return this.deleteWordBackward();
      // case KeyboardCommand.REDO:
      // case KeyboardCommand.REDO_ALT:
      //   return this.redo();
      // case KeyboardCommand.UNDO:
      // case KeyboardCommand.UNDO_ALT:
      //   return this.undo();
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

    return true;
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
    this.insertText([]);
  };

  private readonly eventPaste = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    if (event.clipboardData.types.includes(ClipboardDataType.FILES)) return;
    if (event.clipboardData.types.includes(ClipboardDataType.TEXT_HTML)) {
      const html = event.clipboardData.getData(ClipboardDataType.TEXT_HTML).match(/<!--StartFragment-->(?<html>.*)<!--EndFragment-->/);
      if (html?.groups?.html) {
        this.template.innerHTML = html.groups.html;
        return this.insertText(Character.parseHTML(this.template.content));
      }
    }

    this.template.innerHTML = event.clipboardData.getData(ClipboardDataType.TEXT_PLAIN);
    console.log(this.template.innerHTML);
    // return this.props.onChange(this.props.text.insertHTML(template.innerHTML.replace(/^\n*|\n*$/g, "") ?? ""));
  };
}

interface Segment {
  text: Character[];
  decoration: Decoration;
}

export interface EditTextProps {
  id?: string;
  children: Character[];

  className?: string;
  readonly?: boolean;

  onChange(new_text: Character[], old_text: Character[]): void;
  onSubmit?(text: Character[]): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
  selection: [number, number];
}
