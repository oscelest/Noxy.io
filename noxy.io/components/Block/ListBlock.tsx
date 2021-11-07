import React from "react";
import RichText from "../../classes/RichText/RichText";
import RichTextCharacter from "../../classes/RichText/RichTextCharacter";
import RichTextSection from "../../classes/RichText/RichTextSection";
import ListPageBlockEntity from "../../entities/Page/Block/ListPageBlockEntity";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Helper from "../../Helper";
import Component from "../Application/Component";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import EditText, {EditTextCommandList, EditTextSelection} from "../Text/EditText";
import Style from "./ListBlock.module.scss";

export default class ListBlock extends Component<ListBlockProps, State> {
  
  private static readonly blacklist: EditTextCommandList = [];
  private static readonly whitelist: EditTextCommandList = [];
  
  public static readonly indent_min: number = 1;
  public static readonly indent_max: number = 5;
  public static readonly default_tag: HTMLTag = "ul";
  
  constructor(props: ListBlockProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }
  
  public componentDidUpdate(prevProps: Readonly<ListBlockProps>, prevState: Readonly<State>, snapshot?: any) {
    if (this.state.ref.current && this.state.selection) {
      this.state.ref.current.select(this.state.selection);
      this.setState({selection: undefined});
    }
  }
  
  private shiftLevel(component: EditText, up: boolean) {
    const selection = component.getSelection();
    
    if (up) {
      for (let i = selection.section; i <= selection.section_offset; i++) {
        if (this.props.block.content.value.section_list[i].element.length >= ListBlock.indent_max) continue;
        this.props.block.content.value.section_list[i].element.unshift(component.text.element);
      }
    }
    else {
      for (let i = selection.section; i <= selection.section_offset; i++) {
        if (this.props.block.content.value.section_list[i].element.length <= ListBlock.indent_min) continue;
        this.props.block.content.value.section_list[i].element.shift();
      }
    }
    
    this.setState({selection});
    this.props.onChange(this.props.block);
  };
  
  private insertLineBreak(component: EditText) {
    component.insertText(RichTextCharacter.linebreak);
    this.props.onChange(this.props.block);
  }
  
  private insertParagraph(component: EditText) {
    component.write(new RichTextSection({element: component.text.getSection(component.getSelection().section).element}));
    this.props.onChange(this.props.block);
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <EditText ref={this.state.ref} readonly={this.props.readonly} blacklist={ListBlock.blacklist} whitelist={ListBlock.whitelist}
                  onBlur={this.props.onBlur} onFocus={this.props.onFocus} onSelect={this.props.onSelect} onChange={this.eventChange} onKeyDown={this.eventKeyDown}>
          {this.props.block.content.value}
        </EditText>
      </div>
    );
  }
  
  private readonly eventChange = (text: RichText, component: EditText) => {
    this.props.onChange(this.props.block.replaceText(component.text, text));
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
        return this.shiftLevel(component, true);
      case KeyboardCommand.OUTDENT:
      case KeyboardCommand.PREV_FOCUS:
        return this.shiftLevel(component, false);
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return this.insertParagraph(component);
      case KeyboardCommand.NEW_PARAGRAPH:
      case KeyboardCommand.NEW_PARAGRAPH_ALT:
        return this.insertLineBreak(component);
    }
    
    event.bubbles = true;
  };
}

export interface ListBlockProps extends PageExplorerBlockProps<ListPageBlockEntity> {

}

interface State {
  ref: React.RefObject<EditText>;
  selection?: EditTextSelection;
}
