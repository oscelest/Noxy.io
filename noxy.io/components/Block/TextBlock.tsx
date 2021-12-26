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
    const {readonly = true, decoration, block, className} = this.props;
    const {selection} = this.state;
    if (readonly && !block.content.value.length) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);


    return (
      <div className={classes.join(" ")}>
        <EditText className={Style.Text} readonly={readonly} selection={selection} decoration={decoration} whitelist={TextBlock.whitelist} blacklist={TextBlock.blacklist}
                  onBlur={this.props.onBlur} onFocus={this.props.onFocus} onSelect={this.eventSelect} onChange={this.eventChange}>
          {block.content.value}
        </EditText>
      </div>
    );
  }

  private readonly eventSelect = (selection: EditTextSelection, component: EditText) => {
    this.setState({selection});
    this.props.onSelect(selection, component);
  }

  private readonly eventChange = (text: RichText, component: EditText) => {
    this.props.onChange(this.props.block.replaceText(component.text, text));
  };
}

export interface TextBlockProps extends PageExplorerBlockProps<TextPageBlockEntity> {

}

interface State extends PageExplorerBlockState {
}
