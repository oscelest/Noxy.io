import React from "react";
import PageBlockType from "../../../common/enums/PageBlockType";
import Util from "../../../common/services/Util";
import RichText from "../../classes/RichText";
import ListPageBlockEntity, {ListBlockText} from "../../entities/Page/Block/ListPageBlockEntity";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Helper from "../../Helper";
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
  
  public static create(initializer?: Omit<Initializer<ListPageBlockEntity>, "type">) {
    return new ListPageBlockEntity(initializer);
  }
  
  private getIndex(text: ListBlockText) {
    const index = this.props.block.content.value.findIndex(value => value === text);
    if (index < 0) throw new Error("Could not find text in List Block.");
    return index;
  }
  
  private toList() {
    const result = [] as HierarchyArray<ListBlockText>;
    for (let i = 0; i < this.props.block.content.value.length; i++) {
      const value = this.props.block.content.value[i];
      Util.getNextDeepArrayLevel(result, value.metadata).push(value);
    }
    
    return result;
  }
  
  public componentDidUpdate(prevProps: Readonly<ListBlockProps>, prevState: Readonly<State>, snapshot?: any) {
    if (this.state.ref.current) {
      this.state.ref.current.focus();
      this.setState({inserted_text: undefined});
    }
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        {this.renderList(this.toList())}
      </div>
    );
  }
  
  private readonly renderList = (list: HierarchyArray<ListBlockText>, key: number = 0) => {
    return (
      <ul key={key}>
        {list.map(this.renderElement)}
      </ul>
    );
  };
  
  private readonly renderElement = (element: ListBlockText | HierarchyArray<ListBlockText>, key: number = 0) => {
    if (Array.isArray(element)) return this.renderList(element, key);
    const ref = this.state.inserted_text === element ? this.state.ref : undefined;
    
    return (
      <li key={key}>
        <EditText ref={ref} readonly={this.props.readonly} blacklist={ListBlock.blacklist} whitelist={ListBlock.whitelist}
                  onBlur={this.props.onBlur} onFocus={this.props.onFocus} onSelect={this.props.onSelect} onChange={this.eventChange} onSubmit={this.eventSubmit} onKeyDown={this.eventKeyDown}>
          {element}
        </EditText>
      </li>
    );
  };
  
  private readonly eventChange = (text: ListBlockText, component: EditText) => {
    this.props.onChange(this.props.block.replaceText(component.text, text));
  };
  
  private readonly eventSubmit = (component: EditText) => {
    this.props.onSubmit?.(this.props.block, component);
  };
  
  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, component: EditText) => {
    this.handleKeyDown(event, component);
    if (!event.bubbles) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  
  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, component: EditText) => {
    const command = Helper.getKeyboardEventCommand(event);
    event.bubbles = false;
    
    switch (command) {
      case KeyboardCommand.NEXT_FOCUS:
        return this.shiftContentLevel(component, 1);
      case KeyboardCommand.PREV_FOCUS:
        return this.shiftContentLevel(component, -1);
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return this.insertNewContent(component);
      case KeyboardCommand.NEW_PARAGRAPH:
      case KeyboardCommand.NEW_PARAGRAPH_ALT:
        return component.insertText("\n");
    }
    
    event.bubbles = true;
  };
  
  private readonly shiftContentLevel = (component: EditText, level: number) => {
    this.props.block.content.value[this.getIndex(component.text)].metadata = Util.clamp(level, 5, 1);
    this.props.onChange(this.props.block);
    this.setState({inserted_text: component.text});
  };
  
  private readonly insertNewContent = (component: EditText) => {
    const index = this.getIndex(component.text);
    const {start, end} = component.getSelection();
    const text = this.props.block.content.value[index];
    const next_text = new RichText({...text, value: text.slice(end)});
    
    this.props.block.content.value[index] = new RichText({...text, value: text.slice(0, start)});
    this.props.block.content.value.splice(index, 0, next_text);
    this.setState({inserted_text: next_text});
    return this.props.onChange(this.props.block);
  };
  
}

export interface ListBlockProps extends PageExplorerBlockProps<PageBlockType.LIST> {

}

interface State {
  ref: React.RefObject<EditText>;
  inserted_text?: ListBlockText;
}
