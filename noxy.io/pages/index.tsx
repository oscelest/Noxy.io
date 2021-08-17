import {NextPageContext} from "next";
import Component from "../components/Application/Component";
import HTMLText from "../classes/HTMLText";
import React from "react";
import TextBlock from "../components/Block/TextBlock";

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
    this.state.text.insertHTML("Normal text - <i>Bold - <b>Italic Bold</b> - Bold</i> - Normal text\n");
    this.state.text.insertHTML("<b><i><code><u>Normal text</u></code></i></b> - <code>Code - <u>Underlined code</u> - Code</code> - Normal text");
    this.setState({text: this.state.text});
  }

  public render() {
    return (
      <TextBlock text={this.state.text} readonly={false} onChange={this.eventText}/>
    );
  }

  private readonly eventText = (text: HTMLText) => {
    this.setState({text});
  };
}

interface State {
  text: HTMLText;
}
