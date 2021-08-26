import {v4} from "uuid";
import {NextPageContext} from "next";
import React from "react";
import Character from "../classes/Character";
import Component from "../components/Application/Component";
import PageExplorer from "../components/Application/PageExplorer";
import PageEntity from "../entities/Page/PageEntity";
import PageBlockEntity from "../entities/Page/PageBlockEntity";
import PageBlockType from "../../common/enums/PageBlockType";
import RichText from "../classes/RichText";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends Component<PageProps, State> {

  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: null};
  }

  constructor(props: {}) {
    super(props);

    this.state = {
      page: new PageEntity({
        page_block_list: [
          new PageBlockEntity({
            id:      v4(),
            type:    PageBlockType.TEXT,
            content: new RichText([
              new Character("T"),
              new Character("E"),
              new Character("S"),
              new Character("T"),

              new Character("\n"),
              new Character("\n"),

              new Character("B", {bold: true}),
              new Character("O", {bold: true}),
              new Character("L", {bold: true}),
              new Character("D", {bold: true}),

              new Character(" ", {bold: true}),

              new Character("I", {italic: true, bold: true}),
              new Character("T", {italic: true, bold: true}),
              new Character("A", {italic: true, bold: true}),
              new Character("L", {italic: true, bold: true}),
              new Character("I", {italic: true, bold: true}),
              new Character("C", {italic: true, bold: true}),
              new Character("B", {italic: true, bold: true}),
              new Character("O", {italic: true, bold: true}),
              new Character("L", {italic: true, bold: true}),
              new Character("D", {italic: true, bold: true}),

              new Character(" ", {italic: true}),

              new Character("I", {italic: true, font_size: "22px"}),
              new Character("T", {italic: true, font_size: "22px"}),
              new Character("A", {italic: true, font_size: "22px"}),
              new Character("L", {italic: true, font_size: "22px"}),
              new Character("I", {italic: true, font_size: "22px"}),
              new Character("C", {italic: true, font_size: "22px"}),

              new Character(" ", {italic: true}),

              new Character("I", {italic: true, code: true}),
              new Character("T", {italic: true, code: true}),
              new Character("A", {italic: true, code: true}),
              new Character("L", {italic: true, code: true}),
              new Character("I", {italic: true, code: true}),
              new Character("C", {italic: true, code: true}),
              new Character("C", {italic: true, code: true}),
              new Character("O", {italic: true, code: true}),
              new Character("D", {italic: true, code: true}),
              new Character("E", {italic: true, code: true}),

              new Character(" ", {code: true}),

              new Character("C", {code: true}),
              new Character("O", {code: true}),
              new Character("D", {code: true}),
              new Character("E", {code: true}),

              new Character("\n"),
              new Character("\n"),

              new Character("T"),
              new Character("E"),
              new Character("S"),
              new Character("T"),
            ]),
          }),
        ],
      }),
    };
  }

  public render() {
    return (
      <PageExplorer entity={this.state.page} onChange={this.eventText}/>
    );
  }

  private readonly eventText = (page: PageEntity) => {
    this.setState({page});
  };
}

interface State {
  page: PageEntity;
}
