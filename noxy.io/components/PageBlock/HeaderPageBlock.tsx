import Component from "../Application/Component";
import PageBlockEntity from "../../entities/page/PageBlockEntity";
import React from "react";
import Style from "./HeaderPageBlock.module.scss";
import Button from "../Form/Button";
import IconType from "../../enums/IconType";
import Conditional from "../Application/Conditional";
import {PageBlockProps} from "../Application/PageBlockExplorer";

export default class HeaderPageBlock extends Component<HeaderPageBlockProps, State> {

  private readonly getLevel = () => {
    return Math.min(6, Math.max(1, this.props.block.content.level || 1));
  };

  public render() {
    return (
      <div className={Style.Component}>
        {this.renderHeader()}
        <Conditional condition={!this.props.readonly}>
          <div className={Style.ActionList}>
            <Button icon={IconType.PLUS} onClick={this.eventLevelUpClick}/>
            <Button icon={IconType.MINUS} onClick={this.eventLevelDownClick}/>
          </div>
        </Conditional>
      </div>
    );
  }

  private readonly renderHeader = () => {
    return React.createElement(
      `h${this.getLevel()}`,
      {
        className:                      Style.Content,
        contentEditable:                !this.props.readonly,
        suppressContentEditableWarning: !this.props.readonly,
        "data-level":                   this.props.block.content.level,
        children:                       this.props.block.content.value,
      },
    );
  };

  private readonly eventLevelUpClick = () => {
    if (!this.props.onChange || this.getLevel() <= 1) return;
    this.props.onChange(new PageBlockEntity<HeaderBlockContent>({...this.props.block, content: {...this.props.block.content, level: this.getLevel() - 1}}));
  };

  private readonly eventLevelDownClick = () => {
    if (!this.props.onChange || this.getLevel() >= 6) return;
    this.props.onChange(new PageBlockEntity<HeaderBlockContent>({...this.props.block, content: {...this.props.block.content, level: this.getLevel() + 1}}));
  };

}

export interface HeaderBlockContent {
  value: string
  level: number
}

export interface HeaderPageBlockProps extends PageBlockProps<HeaderBlockContent> {

}

interface State {

}
