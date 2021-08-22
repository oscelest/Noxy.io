import Component from "../Application/Component";
import React from "react";
import Style from "./EditText.module.scss";
import {Character} from "../../classes/Character";
import {Decoration} from "../../classes/Decoration";

export default class EditText extends Component<EditTextProps, State> {

  constructor(props: EditTextProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }

  public componentDidMount(): void {
    // window.addEventListener("mouseup", this.eventMouseUp);
  }

  public componentDidUpdate(prevProps: Readonly<EditTextProps>, prevState: Readonly<State>, snapshot?: any): void {
    // if (document.activeElement === this.state.ref.current) this.focus();
  }

  public componentWillUnmount(): void {
    // window.removeEventListener("mouseup", this.eventMouseUp);
  }

  public render() {
    console.log(this.renderHTML());

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div ref={this.state.ref} className={classes.join(" ")} contentEditable={true} suppressContentEditableWarning={true}
        // onCopy={this.eventCopy} onPaste={this.eventPaste} onCut={this.eventCut}
        // onKeyDown={this.eventKeyDown}
           onKeyPress={this.eventKeyPress}
        // onSelect={this.eventSelect}
      >
        {this.renderText()}
      </div>
    );
  }

  public renderText = () => {
    const lines = this.getLines();
    const result = [] as React.ReactNode[];

    for (let i = 0; i < lines.length; i++) {
      result.push(<div key={i}>{this.getSegmentList(lines[i]).map(this.renderReactElement)}</div>);
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
      <span key={key} style={styling}>{text.map(char => char.value).join("")}</span>
    );
  };

  public renderHTML = () => {
    const lines = this.getLines();
    const container = document.createElement("div");
    for (let i = 0; i < lines.length; i++) {
      container.append(...this.getSegmentList(lines[i]).map(this.renderHTMLNode));
    }
    return container;
  };

  private renderHTMLNode = ({text, decoration}: Segment): Node => {
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
    node.append(document.createTextNode(text.map(char => char.value).join("")));
    return node;

  };

  private appendHTMLNode = (node: Node, segment: Segment) => {
    node.appendChild(this.renderHTMLNode(segment));
    return node;
  };

  private getLines = () => {
    if (!this.props.children || !this.props.children.length) return [];
    const lines = [[]] as Character[][];

    for (let i = 0; i < this.props.children.length; i++) {
      const character = this.props.children[i];
      character.value === "\n" ? lines.push([]) : lines[lines.length - 1].push(character);
    }

    return lines;
  };

  private getSegmentList = (line: Character[]) => {
    const segment_list = [] as {text: Character[], decoration: Decoration}[];

    for (let j = 0; j < line.length; j++) {
      const character = line[j];
      const segment = segment_list[segment_list.length - 1];

      if (!segment || !character.decoration.equals(segment.decoration)) {
        segment_list.push({text: [character], decoration: character.decoration});
      }
      else {
        segment.text.push(character);
      }
    }
    return segment_list;
  };


  // private eventMouseUp = ({target}: MouseEvent) => {
  //   const {current} = this.state.ref;
  //   const selection = window.getSelection();
  //   if (!selection?.anchorNode || !selection?.focusNode || !(target instanceof HTMLElement) || document.activeElement !== current || current?.contains(target)) return;
  //   this.props.text.setSelection(this.getSelection());
  // };
  //
  // private readonly eventSelect = () => {
  //   const selection = window.getSelection();
  //   if (!selection?.anchorNode || !selection?.focusNode) return;
  //   this.props.text.setSelection(this.getSelection());
  // };
  //
  // private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
  //   if (this.handleKeyDown(event) !== true) {
  //     event.preventDefault();
  //     event.stopPropagation();
  //     return false;
  //   }
  // };
  //
  // private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
  //   switch (Helper.getKeyboardEventCommand(event)) {
  //     case KeyboardCommand.SELECT_ALL:
  //       return this.selectAll();
  //     case KeyboardCommand.NEW_LINE:
  //     case KeyboardCommand.NEW_LINE_ALT:
  //       return this.insertNewLine();
  //     case KeyboardCommand.NEW_PARAGRAPH:
  //     case KeyboardCommand.NEW_PARAGRAPH_ALT:
  //       return this.props.onSubmit?.(this.props.text);
  //     case KeyboardCommand.DELETE_FORWARD:
  //       return this.deleteForward();
  //     case KeyboardCommand.DELETE_WORD_FORWARD:
  //       return this.deleteWordForward();
  //     case KeyboardCommand.DELETE_BACKWARD:
  //       return this.deleteBackward();
  //     case KeyboardCommand.DELETE_WORD_BACKWARD:
  //       return this.deleteWordBackward();
  //     case KeyboardCommand.REDO:
  //     case KeyboardCommand.REDO_ALT:
  //       return this.redo();
  //     case KeyboardCommand.UNDO:
  //     case KeyboardCommand.UNDO_ALT:
  //       return this.undo();
  //     case KeyboardCommand.BOLD_TEXT:
  //       return this.decorate(Decoration.BOLD);
  //     case KeyboardCommand.ITALIC_TEXT:
  //       return this.decorate(Decoration.ITALIC);
  //     case KeyboardCommand.UNDERLINE_TEXT:
  //       return this.decorate(Decoration.UNDERLINE);
  //   }
  //
  //   return true;
  // };
  //
  private readonly eventKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    this.getSelection();
    this.props.onChange([...this.props.children, new Character(event.key)], this.props.children);
  };

  private readonly getSelection = () => {
    const selection = getSelection();
    if (!selection) throw "Could not get selection.";
    console.log(selection);

  };

  //
  // private readonly eventCut = async (event: React.ClipboardEvent) => {
  //   event.preventDefault();
  //   event.clipboardData.setData("text/plain", new HTMLText(this.props.text.getCharacterList()).toHTML().innerHTML);
  //   this.props.onChange(this.props.text.delete());
  // };
  //
  // private readonly eventCopy = async (event: React.ClipboardEvent) => {
  //   event.preventDefault();
  //   event.clipboardData.setData("text/html", new HTMLText(this.props.text.getCharacterList()).toHTML().innerHTML);
  // };
  //
  // private readonly eventPaste = async (event: React.ClipboardEvent) => {
  //   event.preventDefault();
  //   const template = document.createElement("template") as HTMLTemplateElement;
  //   template.innerHTML = event.clipboardData.getData("text/html");
  //   return this.props.onChange(this.props.text.insertHTML(template.innerHTML.replace(/^\n*|\n*$/g, "") ?? ""));
  // };
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
  onSubmit?(new_text: Character[], old_text: Character[]): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
}

// interface NodeSearch {
//   node: Node;
//   length: number;
// }
