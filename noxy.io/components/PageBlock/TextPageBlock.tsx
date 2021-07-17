import Component from "../Application/Component";
import Style from "./TextPageBlock.module.scss";
import React from "react";
import {PageBlockProps} from "../Application/PageBlockExplorer";
import Conditional from "../Application/Conditional";
import Button from "../Form/Button";
import IconType from "../../enums/IconType";

export default class TextPageBlock extends Component<TextPageBlockProps, State> {

  public render() {
    return (
      <div className={Style.Component}>
        {this.renderContent()}
        <Conditional condition={!this.props.readonly}>
          <div className={Style.ActionList}>
            <Button icon={IconType.CLOSE}/>
          </div>
        </Conditional>
      </div>
    );
  }

  private readonly renderContent = () => {
    return (
      <div className={Style.Content} contentEditable={!this.props.readonly} suppressContentEditableWarning={!this.props.readonly}>
        {this.props.block.content}
      </div>
    )
  };

}

export interface TextPageBlockProps extends PageBlockProps<string> {

}

interface State {
  
}
