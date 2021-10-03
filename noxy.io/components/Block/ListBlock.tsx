import React from "react";
import PageBlockType from "../../../common/enums/PageBlockType";
import Util from "../../../common/services/Util";
import Character from "../../classes/Character";
import RichText, {RichTextLine} from "../../classes/RichText";
import {ListBlockText} from "../../entities/Page/Block/ListPageBlockEntity";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Helper from "../../Helper";
import Component from "../Application/Component";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import EditText, {EditTextCommandList, EditTextElement, EditTextSelection} from "../Text/EditText";
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
  
  public componentDidUpdate(prevProps: Readonly<ListBlockProps>, prevState: Readonly<State>, snapshot?: any) {
    if (this.state.ref.current && this.state.selection) {
      const {start, end, forward} = this.state.selection;
      this.state.ref.current.select(start, end, forward);
      this.setState({selection: undefined});
    }
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <EditText ref={this.state.ref} readonly={this.props.readonly} blacklist={ListBlock.blacklist} whitelist={ListBlock.whitelist}
                  rendererContent={"ul"} rendererLine={this.renderLine}
                  onBlur={this.props.onBlur} onFocus={this.props.onFocus} onSelect={this.props.onSelect} onChange={this.eventChange} onSubmit={this.eventSubmit} onKeyDown={this.eventKeyDown}>
          {this.props.block.content.value}
        </EditText>
      </div>
    );
  }
  
  private readonly renderLine = (line: RichTextLine) => {
    const metadata = this.props.block.content.value.metadata;
    const {group, indent} = metadata.at(line.index) ?? {};
    const value = group ? metadata.at(group)?.indent ?? indent : indent;
    return [...Array(value).fill("ul"), group ? "div" : "li"] as EditTextElement;
  }
  
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
      case KeyboardCommand.INDENT:
      case KeyboardCommand.NEXT_FOCUS:
        return this.shiftLevelBy(component, 1);
      case KeyboardCommand.OUTDENT:
      case KeyboardCommand.PREV_FOCUS:
        return this.shiftLevelBy(component, -1);
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return this.insertNewGroup(component);
      case KeyboardCommand.NEW_PARAGRAPH:
      case KeyboardCommand.NEW_PARAGRAPH_ALT:
        return this.insertNewLine(component);
    }
    
    event.bubbles = true;
  };
  
  private readonly shiftLevelBy = (component: EditText, value: number) => {
    const {start, end, forward} = component.getSelection();
    if (start === end) {
      const line = component.text.getLine(start);
      this.props.block.content.value.metadata[line] = Util.clamp(this.props.block.content.value.metadata[line] + value, 5, 1);
      this.setState({selection: component.getSelection()});
    }
    else {
      const start_line = component.text.getLine(start);
      const end_line = component.text.getLine(end);
      for (let i = start_line; i <= end_line; i++) {
        this.props.block.content.value.metadata[i] = Util.clamp(this.props.block.content.value.metadata[i] + value, 5, 1);
      }
      this.setState({selection: {start, end, forward}});
    }
  };
  
  private readonly insertLineBreak = (component: EditText, grouped: boolean) => {
    const {start, end} = component.getSelection();
    const line = component.text.getLine(start);
    const metadata = this.props.block.content.value.metadata;
    
    this.props.block.content.value = new RichText({
      value:    [...component.text.slice(0, start), Character.linebreak, ...component.text.slice(end)],
      metadata: [...this.props.block.content.value.metadata.slice(0, line + 1), , ...this.props.block.content.value.metadata.slice(line + 1)],
    });
  
    this.setState({selection: {start: start + 1, end: start + 1, forward: true}});
    this.props.onChange(this.props.block);
  }
  
  private readonly insertNewGroup = (component: EditText) => {
    const {start, end} = component.getSelection();
    const line = component.text.getLine(start);
    this.props.block.content.value = new RichText({
      value:    [...component.text.slice(0, start), Character.linebreak, ...component.text.slice(end)],
      metadata: [...this.props.block.content.value.metadata.slice(0, line + 1), this.props.block.content.value.metadata[line], ...this.props.block.content.value.metadata.slice(line + 1)],
    });
    
    this.setState({selection: {start: start + 1, end: start + 1, forward: true}});
    this.props.onChange(this.props.block);
  };
  
  private readonly insertNewLine = (component: EditText) => {
    const {start, end} = component.getSelection();
    
    
  }
}

export interface ListBlockProps extends PageExplorerBlockProps<PageBlockType.LIST> {

}

interface State {
  ref: React.RefObject<EditText>;
  selection?: EditTextSelection;
}
