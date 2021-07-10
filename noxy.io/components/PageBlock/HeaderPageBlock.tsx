import Component from "../Application/Component";
import PageBlockEntity from "../../entities/page/PageBlockEntity";
import React from "react";
import Style from "./HeaderPageBlock.module.scss";

export default class HeaderPageBlock extends Component<HeaderPageBlockProps, State> {

  public render() {
    return (
      <div className={Style.Component}>
        {this.renderHeader}
      </div>
    );
  }

  private readonly renderHeader = () => {
    return React.createElement(`h${Math.min(1, Math.max(6, this.props.block.content.level))}`, {children: this.props.block.content.value});
  }

}

interface HeaderPageBlockProps {
  block: PageBlockEntity<{value: string, level: number}>
}

interface State {
  
}
