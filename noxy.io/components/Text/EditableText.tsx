import Component from "../Application/Component";
import React from "react";
import HTMLText, {FixedSelection, FlexibleSelection} from "../../classes/HTMLText";
import Helper from "../../Helper";
import Decoration from "../../../common/enums/Decoration";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Style from "./EditableText.module.scss";

export default class EditableText extends Component<EditableTextProps, State> {

  constructor(props: EditableTextProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }

  public redo() {
    this.props.onChange(this.props.text.redo());
  }

  public undo() {
    this.props.onChange(this.props.text.undo());
  }

  public decorate(decoration: Decoration | Decoration[], selection?: FixedSelection | FlexibleSelection) {
    this.props.onChange(this.props.text.changeDecoration(decoration, selection));
  }

  public insertNewLine(decoration?: Decoration | Decoration[], selection?: FixedSelection | FlexibleSelection) {
    this.props.onChange(this.props.text.insertNewLine(decoration, selection));
  };

  public deleteForward() {
    this.props.onChange(this.props.text.deleteForward());
  }

  public deleteBackward() {
    this.props.onChange(this.props.text.deleteBackward());
  }

  public deleteWordForward() {
    this.props.onChange(this.props.text.deleteWordForward());
  }

  public deleteWordBackward() {
    this.props.onChange(this.props.text.deleteWordBackward());
  }

  public selectAll() {
    this.props.onChange(this.props.text.setSelection({start: 0, end: this.props.text.getLength()}));
  }

  private readonly focus = () => {
    this.state.ref.current?.focus();
    let {node: anchor, length: anchor_offset} = this.findNodeByPosition(this.props.text.getSelection().start);
    let {node: focus, length: focus_offset} = this.findNodeByPosition(this.props.text.getSelection().end);

    if (anchor instanceof HTMLBRElement || anchor === this.state.ref.current) anchor_offset = 0;
    if (focus instanceof HTMLBRElement || focus === this.state.ref.current) focus_offset = 0;
    if (anchor instanceof HTMLBRElement && anchor === focus && anchor_offset === focus_offset) {
      getSelection()?.setPosition(anchor.parentNode, 0);
    }
    else {
      getSelection()?.setBaseAndExtent(anchor, anchor_offset, focus, focus_offset);
    }
  };

  private readonly getSelection = () => {
    const selection = getSelection();
    if (!selection) throw "Selection does not exist.";
    if (!this.state.ref.current) throw "Reference object no longer exists.";
    if (!selection.focusNode || !this.state.ref.current.contains(selection.focusNode)) throw "Focus node does not exist.";
    if (!selection.anchorNode || !this.state.ref.current.contains(selection.anchorNode)) throw "Anchor node does not exist.";

    const {node: focus_node, offset: focus_offset} = this.parseSelection(selection.focusNode, selection.focusOffset);
    const {node: anchor_node, offset: anchor_offset} = this.parseSelection(selection.anchorNode, selection.anchorOffset);

    const focus = this.findPositionByNode(focus_node) + focus_offset;
    const anchor = this.findPositionByNode(anchor_node) + anchor_offset;

    const start = Math.min(focus, anchor);
    const end = Math.max(focus, anchor);

    return {start, end, length: end - start};
  };

  private readonly parseSelection = (node: Node, offset: number) => {
    const selection = {node, offset} as {node: Node, offset: number};
    if (node === this.state.ref.current) {
      selection.node = node.childNodes[offset];
      selection.offset = 0;
    }
    return selection;
  };

  private readonly findPositionByNode = (target: Node, container: Node | null = this.state.ref.current): number => {
    if (container === null) throw "No container found";
    if (container instanceof Text) return container.length;

    let position = 0;
    for (let i = 0; i < container.childNodes.length; i++) {
      const child = container.childNodes[i];
      if (child === target) return position;

      const text_length = this.getElementTextLength(child);
      const length = this.findPositionByNode(target, child);
      position += length;

      if (text_length > length) break;
      if (container === this.state.ref.current) position++;
    }

    return position;
  };

  private readonly findNodeByPosition = (length: number, container: Node | null = this.state.ref.current): NodeSearch => {
    if (container === null) throw "Container not yet initialized.";
    if (length < 0) throw "Search cannot be negative";

    for (let i = 0; i < container.childNodes.length; i++) {
      const child = container.childNodes[i];
      const text_length = this.getElementTextLength(child);
      if (text_length >= length) {
        if (child instanceof Text) return {length, node: child};
        return this.findNodeByPosition(length, child);
      }

      length -= text_length;
      if (container === this.state.ref.current) length--;
    }

    return {length, node: container};
  };

  private readonly getElementTextLength = (node: ChildNode) => {
    if (!node.textContent) return 0;
    return node.textContent.length;
  };

  public componentDidMount(): void {
    window.addEventListener("mouseup", this.eventMouseUp);
  }

  public componentDidUpdate(prevProps: Readonly<EditableTextProps>, prevState: Readonly<State>, snapshot?: any): void {
    if (document.activeElement === this.state.ref.current) this.focus();
  }

  public componentWillUnmount(): void {
    window.removeEventListener("mouseup", this.eventMouseUp);
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div ref={this.state.ref} className={classes.join(" ")} contentEditable={true} suppressContentEditableWarning={true} style={{display: "block"}}
           onCopy={this.eventCopy} onPaste={this.eventPaste} onCut={this.eventCut} onKeyDown={this.eventKeyDown} onKeyPress={this.eventKeyPress} onSelect={this.eventSelect}>
        {this.props.text.toReactElementList()}
      </div>
    );
  }

  private eventMouseUp = ({target}: MouseEvent) => {
    const {current} = this.state.ref;
    const selection = window.getSelection();
    if (!selection?.anchorNode || !selection?.focusNode || !(target instanceof HTMLElement) || document.activeElement !== current || current?.contains(target)) return;
    this.props.text.setSelection(this.getSelection());
  };

  private readonly eventSelect = () => {
    const selection = window.getSelection();
    if (!selection?.anchorNode || !selection?.focusNode) return;
    this.props.text.setSelection(this.getSelection());
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
        return this.selectAll();
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return this.insertNewLine();
      case KeyboardCommand.NEW_PARAGRAPH:
      case KeyboardCommand.NEW_PARAGRAPH_ALT:
        return this.props.onSubmit?.(this.props.text);
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
        return this.decorate(Decoration.BOLD);
      case KeyboardCommand.ITALIC_TEXT:
        return this.decorate(Decoration.ITALIC);
      case KeyboardCommand.UNDERLINE_TEXT:
        return this.decorate(Decoration.UNDERLINE);
    }

    return true;
  };

  private readonly eventKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    this.props.onChange(this.props.text.insertHTML(event.key, this.props.text.getCharacterDecoration()));
  };

  private readonly eventCut = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    event.clipboardData.setData("text/plain", new HTMLText(this.props.text.getCharacterList()).toHTML().innerHTML);
    this.props.onChange(this.props.text.delete());
  };

  private readonly eventCopy = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    event.clipboardData.setData("text/html", new HTMLText(this.props.text.getCharacterList()).toHTML().innerHTML);
  };

  private readonly eventPaste = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    const template = document.createElement("template") as HTMLTemplateElement;
    template.innerHTML = event.clipboardData.getData("text/html");
    return this.props.onChange(this.props.text.insertHTML(template.innerHTML.replace(/^\n*|\n*$/g, "") ?? ""));
  };
}

export interface EditableTextProps {
  className?: string;
  text: HTMLText;

  onChange(text: HTMLText): void;
  onSubmit?(text: HTMLText): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
}

interface NodeSearch {
  node: Node;
  length: number;
}
