import React from "react";
import {v4} from "uuid";
import PageBlockType from "../../../common/enums/PageBlockType";
import RichText from "../../classes/RichText";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import Component from "../Application/Component";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import EditText, {EditTextCommandList} from "../Text/EditText";
import Style from "./TextBlock.module.scss";

export default class TextBlock extends Component<TextBlockProps, State> {
  
  private static readonly blacklist: EditTextCommandList = [];
  private static readonly whitelist: EditTextCommandList = [];
  
  constructor(props: TextBlockProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }
  
  public static create = () => {
    return new PageBlockEntity({
      id:      v4(),
      type:    PageBlockType.TEXT,
      content: new RichText(),
    });
  };
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <EditText ref={this.state.ref} readonly={this.props.readonly} blacklist={TextBlock.blacklist} whitelist={TextBlock.whitelist}
                  onBlur={this.props.onBlur} onFocus={this.props.onFocus} onSelect={this.props.onSelect} onChange={this.eventChange} onSubmit={this.eventSubmit}>
          {this.props.block.content}
        </EditText>
      </div>
    );
  }
  
  private readonly eventChange = (content: RichText) => {
    this.props.onChange(new PageBlockEntity<PageBlockType.TEXT>({...this.props.block, content}));
  };
  
  private readonly eventSubmit = () => {
    this.props.onSubmit?.(this.props.block);
  };
  
}

export interface TextBlockProps extends PageExplorerBlockProps<PageBlockType.TEXT> {

}

interface State {
  ref: React.RefObject<EditText>;
}
