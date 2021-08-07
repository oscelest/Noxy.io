import {NextPageContext} from "next";
import Component from "../components/Application/Component";
import HTMLText from "../classes/HTMLText";
import React from "react";
import Decoration from "../../common/enums/Decoration";
import Util from "../../common/services/Util";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends Component<PageProps, State> {

  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: null};
  }

  constructor(props: {}) {
    super(props);

    this.state = {
      ref:  React.createRef(),
      text: new HTMLText(),
    };
  }

  public componentDidMount(): void {
    this.state.text.addHTML("Workspace in classic editors is made of a <b>single <i>contenteditable</i> element</b>, used to create different <i>HTML markups</i>. ");
    this.state.text.addHTML("<mark>Editor.js <b>workspace consists of separate Blocks</b>: paragraphs, headings, images, lists, quotes, etc.</mark> ");
    this.state.text.addHTML("Each of them is an independent contenteditable element <code>(or more complex structure)</code> provided by Plugin and united by Editor's Core.");

    this.setState({text: this.state.text});
  }

  public render() {
    return (
      <div ref={this.state.ref} contentEditable={true} suppressContentEditableWarning={true} style={{display: "block"}}
           onCopy={this.eventCopy} onPaste={this.eventPaste}>
        {this.state.text.toReactElementList()}
      </div>
    );
  }

  // private readonly eventInput = (event: React.SyntheticEvent<HTMLDivElement, InputEvent>) => {
  //     event.persist();
  //     console.log(event.nativeEvent);
  //     console.log(this.getSelection());
  //
  //     switch (event.nativeEvent.inputType) {
  //       case "deleteContentBackward":
  //       case "historyUndo":
  //       case "historyRedo":
  //       case "insertFromPaste":
  //         console.log(this.state.text.setText(this.state.ref.current?.outerHTML!))
  //         // return this.setState({text:  this.state.text.setText(this.state.ref.current?.outerHTML!)});
  //     }
  //
  //     if (event.nativeEvent.inputType === "deleteContentBackward") {
  //       console.log(this.state.text.getCharacterList())
  //     }
  //
  //     if (event.nativeEvent.inputType === "historyUndo") {
  //
  //     }
  //
  // };

  private readonly eventCopy = (event: React.SyntheticEvent<HTMLDivElement, ClipboardEvent>) => {
    event.preventDefault();

    const {start, end} = this.getSelection();
    const data = new HTMLText(this.state.text.getCharacterList(start, end)).toHTML();
    event.nativeEvent.clipboardData?.setData("text/plain", data);
  };

  private readonly eventPaste = (event: React.SyntheticEvent<HTMLDivElement, ClipboardEvent>) => {
    event.preventDefault();

    const paste = event.nativeEvent.clipboardData?.getData("text");
    if (!paste) return;

    const {start, length} = this.getSelection();
    this.setState({text: this.state.text.addHTML(paste, Decoration.NONE, start, length)});

    Util.schedule(() => {
      const element = document.createElement("div");
      element.innerHTML = paste;
      const {node, length} = this.findNodeByPosition(element.innerText.length + start);
      window.getSelection()?.setPosition(node, length);
    });

  };

  private readonly getSelection = () => {
    const selection = window.getSelection();
    if (!selection) throw "Selection does not exist.";
    if (!this.state.ref.current) throw "Reference object no longer exists.";
    if (!selection.focusNode || !this.state.ref.current.contains(selection.focusNode)) throw "Focus node does not exist.";
    if (!selection.anchorNode || !this.state.ref.current.contains(selection.anchorNode)) throw "Anchor node does not exist.";

    const focus = this.findPositionByNode(selection.focusNode) + selection.focusOffset;
    const anchor = this.findPositionByNode(selection.anchorNode) + selection.anchorOffset;

    const start = Math.min(focus, anchor);
    const end = Math.max(focus, anchor);

    return {start, end, length: end - start};
  };

  private readonly findPositionByNode = (target: Node, container: Node | null = this.state.ref.current): number => {
    if (container === null) throw "No container found";
    if (container instanceof Text) return container.length;

    let position = 0;
    for (let i = 0; i < container.childNodes.length; i++) {
      const child = container.childNodes[i];
      if (child === target) return position;

      const text_length = child.textContent?.length ?? 0;
      const length = text_length > 0 ? this.findPositionByNode(target, child) : 0;
      position += length;

      if (text_length > length) break;
    }

    return position;
  }

  private readonly findNodeByPosition = (length: number, container: Node | null = this.state.ref.current): NodeSearch => {
    if (container === null) throw "Container not yet initialized.";
    if (length < 0) throw "Search cannot be negative";

    for (let i = 0; i < container.childNodes.length; i++) {
      const child = container.childNodes[i];
      const text_length = child.textContent?.length ?? 0;
      if (text_length > length) return child instanceof Text ? {length, node: child} : this.findNodeByPosition(length, child);

      length -= text_length;
    }

    return {length, node: container};
  };
}

interface NodeSearch {
  node: Node
  length: number
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
  text: HTMLText;
}
