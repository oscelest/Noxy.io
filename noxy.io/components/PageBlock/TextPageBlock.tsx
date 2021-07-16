import Component from "../Application/Component";
import Style from "./TextPageBlock.module.scss";
import React from "react";
import {PageBlockProps} from "../Application/PageBlockExplorer";
import {HeaderBlockContent} from "./HeaderPageBlock";

export default class TextPageBlock extends Component<TextPageBlockProps, State> {

  public render() {
    return (
      <div className={Style.Component}>
        Hello world
      </div>
    );
  }
}

export interface TextPageBlockProps extends PageBlockProps<HeaderBlockContent> {

}

interface State {
  
}
