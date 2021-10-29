import React from "react";
import RichText from "../../classes/RichText/RichText";
import TextPageBlockEntity from "../../entities/Page/Block/TextPageBlockEntity";
import Component from "../Application/Component";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import EditText, {EditTextCommandList} from "../Text/EditText";
import Style from "./TextBlock.module.scss";

export default class TextBlock extends Component<TextBlockProps, State> {
  
  private static readonly blacklist: EditTextCommandList = [];
  private static readonly whitelist: EditTextCommandList = [];
  
  constructor(props: TextBlockProps) {
    super(props);
    this.state = {};
  }
  
  public render() {
    const readonly = this.props.readonly ?? true;
    if (readonly && !this.props.block.content.value.length) return null;
    
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <EditText className={Style.Text} readonly={this.props.readonly} blacklist={TextBlock.blacklist} whitelist={TextBlock.whitelist}
                  onBlur={this.props.onBlur} onFocus={this.props.onFocus} onSelect={this.props.onSelect} onChange={this.eventChange}>
          {this.props.block.content.value}
        </EditText>
      </div>
    );
  }
  
  private readonly eventChange = (text: RichText, component: EditText) => {
    this.props.onChange(this.props.block.replaceText(component.text, text));
  };
}

export interface TextBlockProps extends PageExplorerBlockProps<TextPageBlockEntity> {

}

interface State {

}
