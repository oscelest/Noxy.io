import {NextPageContext} from "next";
import Component from "../components/Application/Component";
import HTMLText from "../classes/HTMLText";
import React from "react";
import EditableText from "../components/Text/EditableText";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends Component<PageProps, State> {

  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: null};
  }

  constructor(props: {}) {
    super(props);

    this.state = {
      text: new HTMLText(),
    };
  }

  public componentDidMount(): void {
    // this.state.text.insertHTML("Workspace in classic editors is made of a <b>single <i>contenteditable</i> element</b>, used to create different <i>HTML markups</i>. ");
    // this.state.text.insertHTML("<mark>Editor.js <b>workspace consists of separate Blocks</b>: paragraphs, headings, images, lists, quotes, etc.</mark> ");
    // this.state.text.insertHTML("Each of them is an independent contenteditable element <code>(or more complex structure)</code> provided by Plugin and united by Editor's Core.");
    this.state.text.insertHTML("<b>Test.</b><br><br>Text.");
    this.setState({text: this.state.text});
  }

  public render() {
    return (
      <EditableText text={this.state.text} onChange={this.eventText} onSubmit={() => {}}/>
    );
  }

  private readonly eventText = (text: HTMLText) => {
    this.setState({text});
  };
}

interface State {
  text: HTMLText;
}
