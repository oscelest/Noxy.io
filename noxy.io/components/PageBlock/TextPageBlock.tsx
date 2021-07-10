import Component from "../Application/Component";
import Style from "./TextPageBlock.module.scss";
import React from "react";
import PageBlockEntity from "../../entities/page/PageBlockEntity";

export default class TextPageBlock extends Component<TextPageBlockProps, State> {

  public render() {
    return (
      <div className={Style.Component}>
        Hello world
      </div>
    );
  }
}

interface TextPageBlockProps {
  block: PageBlockEntity<{}>
}

interface State {
  
}
