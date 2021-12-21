import React from "react";
import RichText from "../../classes/RichText/RichText";
import TextPageBlockEntity from "../../entities/Page/Block/TextPageBlockEntity";
import Component from "../Application/Component";
import {PageExplorerBlockProps, PageExplorerBlockState} from "../Application/PageExplorer";
import EditText, {EditTextCommandList, EditTextSelection} from "../Text/EditText";
import Style from "./TextBlock.module.scss";

export default class TextBlock extends Component<TextBlockProps, State> {

  private static readonly blacklist: EditTextCommandList = [];
  private static readonly whitelist: EditTextCommandList = [];

  constructor(props: TextBlockProps) {
    super(props);
    this.state = {
      selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: true},
    };
  }

  public render() {
    const readonly = this.props.readonly ?? true;
    if (readonly && !this.props.block.content.value.length) return null;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <EditText className={Style.Text} readonly={this.props.readonly} selection={this.state.selection} decoration={this.props.decoration} whitelist={TextBlock.whitelist}
                  blacklist={TextBlock.blacklist}
                  onBlur={this.props.onBlur} onFocus={this.props.onFocus} onChange={this.eventChange}>
          {this.props.block.content.value}
        </EditText>
      </div>
    );
  }

  private readonly eventChange = (selection: EditTextSelection, text: RichText, component: EditText) => {
    this.setState({selection});
    this.props.onChange(this.props.block.replaceText(component.text, text));
    this.props.onSelect(selection, component);
  };
}

export interface TextBlockProps extends PageExplorerBlockProps<TextPageBlockEntity> {

}

interface State extends PageExplorerBlockState {
}
