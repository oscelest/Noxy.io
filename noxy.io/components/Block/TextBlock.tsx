import React from "react";
import {v4} from "uuid";
import PageBlockType from "../../../common/enums/PageBlockType";
import Decoration from "../../classes/Decoration";
import RichText from "../../classes/RichText";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import Component from "../Application/Component";
import {DefaultBlockProps, PageBlockInterface} from "../Application/PageExplorer";
import EditText from "../Text/EditText";
import Style from "./TextBlock.module.scss";

export default class TextBlock extends Component<TextBlockProps, State> implements PageBlockInterface {
  
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
  
  public decorate(decoration: Initializer<Decoration>): void {
    this.state.ref.current?.decorate(decoration);
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <EditText ref={this.state.ref} readonly={this.props.readonly} onBlur={this.eventBlur} onFocus={this.eventFocus} onChange={this.eventChange} onSubmit={this.eventSubmit}>
          {this.props.block.content}
        </EditText>
      </div>
    );
  }
  
  private readonly eventBlur = () => {
    this.props.onBlur?.(this.props.block);
  };
  
  private readonly eventFocus = () => {
    this.props.onFocus?.(this.props.block);
  };
  
  private readonly eventChange = (content: RichText) => {
    this.props.onChange(new PageBlockEntity<PageBlockType.TEXT>({...this.props.block, content}));
  };
  
  private readonly eventSubmit = (content: RichText) => {
    this.props.onSubmit?.(new PageBlockEntity<PageBlockType.TEXT>({...this.props.block, content}));
  };
  
}

export interface TextBlockProps extends DefaultBlockProps<PageBlockType.TEXT> {

}

interface State {
  ref: React.RefObject<EditText>;
}
