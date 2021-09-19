import React from "react";
import {v4} from "uuid";
import PageBlockType from "../../../common/enums/PageBlockType";
import Character from "../../classes/Character";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import Component from "../Application/Component";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import EditText, {EditTextCommandList} from "../Text/EditText";
import Style from "./ListBlock.module.scss";

export default class ListBlock extends Component<ListBlockProps, State> {
  
  private static readonly blacklist: EditTextCommandList = [];
  private static readonly whitelist: EditTextCommandList = [];
  
  constructor(props: ListBlockProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }
  
  public static create = () => {
    return new PageBlockEntity({
      id:      v4(),
      type:    PageBlockType.LIST,
      content: [
        []
      ],
    });
  };
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        {this.renderList(this.props.block.content)}
      </div>
    );
  }
  
  private readonly renderList = (list: RecursiveArray<Character[]>) => {
    return (
      <ul>
        {list.map(this.renderElement)}
      </ul>
    );
  };
  
  private readonly renderElement = (element: Character[] | RecursiveArray<Character[]>) => {
    if (Array.isArray(element)) return this.renderList(element);
    
    return (
      <li>
        <EditText readonly={this.props.readonly} blacklist={ListBlock.blacklist} whitelist={ListBlock.whitelist}
                  onBlur={this.props.onBlur} onFocus={this.props.onFocus} onSelect={this.props.onSelect} onChange={this.eventChange} onSubmit={this.eventSubmit}>
          {element}
        </EditText>
      </li>
    );
  };
  
  private readonly eventChange = (content: Character[]) => {
    this.props.onChange(new PageBlockEntity<PageBlockType.LIST>({...this.props.block, content}));
  };
  
  private readonly eventSubmit = () => {
    this.props.onSubmit?.(this.props.block);
  };
  
}

export interface ListBlockProps extends PageExplorerBlockProps<PageBlockType.LIST> {

}

interface State {
  ref: React.RefObject<EditText>;
}
