import React from "react";
import {v4} from "uuid";
import PageBlockType from "../../../common/enums/PageBlockType";
import Decoration from "../../classes/Decoration";
import RichText from "../../classes/RichText";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import Component from "../Application/Component";
import {DefaultBlockProps, PageBlockInterface} from "../Application/PageExplorer";
import EditText from "../Text/EditText";
import Style from "./HeaderBlock.module.scss";

export default class HeaderBlock extends Component<HeaderBlockProps, State> implements PageBlockInterface {

  constructor(props: HeaderBlockProps) {
    super(props);
    this.state = {
      ref: React.createRef()
    }
  }
  
  public static create = () => {
    return new PageBlockEntity<PageBlockType.HEADER>({
      id:      v4(),
      type:    PageBlockType.HEADER,
      content: {text: new RichText(), size: 1},
    });
  }
  
  public decorate(decoration: Initializer<Decoration>): void {
    this.state.ref.current?.decorate(decoration);
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {this.renderHeader()}
      </div>
    );
  }

  private readonly renderHeader = () => {
    switch (this.props.block.content.size) {
      case 1:
        return <h1>{this.renderEditText()}</h1>;
      case 2:
        return <h2>{this.renderEditText()}</h2>;
      case 3:
        return <h3>{this.renderEditText()}</h3>;
      case 4:
        return <h4>{this.renderEditText()}</h4>;
      case 5:
        return <h5>{this.renderEditText()}</h5>;
      case 6:
        return <h6>{this.renderEditText()}</h6>;
      default:
        throw `Cannot render header with size not between 1 and 6 - Actual size '${this.props.block.content.size}'`;
    }
  };

  private readonly renderEditText = () => {
    return (
      <EditText ref={this.state.ref} readonly={this.props.readonly} onBlur={this.eventBlur} onFocus={this.eventFocus} onChange={this.eventChange} onSubmit={this.eventSubmit}>
        {this.props.block.content.text}
      </EditText>
    );
  };
  
  private readonly eventBlur = () => {
    this.props.onBlur?.(this.props.block);
  }

  private readonly eventFocus = () => {
    this.props.onFocus?.(this.props.block);
  }
  
  private readonly eventChange = (text: RichText) => {
    this.props.onChange(new PageBlockEntity<PageBlockType.HEADER>({...this.props.block, content: {...this.props.block.content, text}}));
  };

  private readonly eventSubmit = (text: RichText) => {
    this.props.onSubmit?.(new PageBlockEntity<PageBlockType.HEADER>({...this.props.block, content: {...this.props.block.content, text}}));
  };
}

export interface HeaderBlockProps extends DefaultBlockProps<PageBlockType.HEADER> {

}

interface State {
  ref: React.RefObject<EditText>
}
