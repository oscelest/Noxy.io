import React from "react";
import {v4} from "uuid";
import PageBlockType from "../../../common/enums/PageBlockType";
import Util from "../../../common/services/Util";
import RichText from "../../classes/RichText";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import Button from "../Form/Button";
import EditText, {EditTextCommandList} from "../Text/EditText";
import Style from "./HeaderBlock.module.scss";

export default class HeaderBlock extends Component<HeaderBlockProps, State> {
  
  private static readonly blacklist: EditTextCommandList = ["bold"];
  private static readonly whitelist: EditTextCommandList = [];
  
  constructor(props: HeaderBlockProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }
  
  public static create = () => {
    return new PageBlockEntity<PageBlockType.HEADER>({
      id:      v4(),
      type:    PageBlockType.HEADER,
      content: {text: new RichText(), size: 1},
    });
  };
  
  public render() {
    const readonly = this.props.readonly ?? true;
    if (readonly && !this.props.block.content.text.length) return null;
    
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <Conditional condition={!readonly}>
          {this.renderOptionList()}
        </Conditional>
        {this.renderHeader()}
      </div>
    );
  }
  
  private readonly renderHeader = () => {
    return React.createElement(`h${Util.clamp(this.props.block.content.size, 6)}`, {className: Style.Text, children: this.renderEditText()});
  };
  
  private readonly renderEditText = () => {
    return (
      <EditText ref={this.state.ref} readonly={this.props.readonly} whitelist={HeaderBlock.whitelist} blacklist={HeaderBlock.blacklist}
                onBlur={this.props.onBlur} onFocus={this.props.onFocus} onSelect={this.props.onSelect} onChange={this.eventChange} onSubmit={this.eventSubmit}>
        {this.props.block.content.text}
      </EditText>
    );
  };
  
  private readonly renderOptionList = () => {
    return (
      <div className={Style.OptionList}>
        <Button value={1} onClick={this.eventHeaderLevelClick}>H1</Button>
        <Button value={2} onClick={this.eventHeaderLevelClick}>H2</Button>
        <Button value={3} onClick={this.eventHeaderLevelClick}>H3</Button>
        <Button value={4} onClick={this.eventHeaderLevelClick}>H4</Button>
        <Button value={5} onClick={this.eventHeaderLevelClick}>H5</Button>
        <Button value={6} onClick={this.eventHeaderLevelClick}>H6</Button>
      </div>
    );
  };
  
  private readonly eventChange = (text: RichText) => {
    this.props.onChange(new PageBlockEntity<PageBlockType.HEADER>({...this.props.block, content: {...this.props.block.content, text}}));
  };
  
  private readonly eventSubmit = () => {
    this.props.onSubmit?.(this.props.block);
  };
  
  private readonly eventHeaderLevelClick = (size: number) => {
    this.props.onChange(new PageBlockEntity<PageBlockType.HEADER>({...this.props.block, content: {...this.props.block.content, size}}));
  };
}

export interface HeaderBlockProps extends PageExplorerBlockProps<PageBlockType.HEADER> {

}

interface State {
  ref: React.RefObject<EditText>;
}
