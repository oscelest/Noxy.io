import React from "react";
import Component from "../Application/Component";
import EditText, {EditTextSelection} from "../Text/EditText";
import KeyboardCommand from "../../enums/KeyboardCommand";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import RichText, {RichTextInitializer} from "../../classes/RichText/RichText";
import RichTextCharacter from "../../classes/RichText/RichTextCharacter";
import RichTextSection from "../../classes/RichText/RichTextSection";
import Helper, {KeyboardCommandDelegate} from "../../Helper";
import {PageExplorerBlockProps} from "../Application/BlockEditor/BlockEditor";
import {RichTextDecorationKeys} from "../../classes/RichText/RichTextDecoration";
import Style from "./ListBlock.module.scss";

export default class ListBlock extends Component<ListBlockProps, State> {

  private static readonly blacklist: RichTextDecorationKeys[] = [];
  private static readonly whitelist: RichTextDecorationKeys[] = [];

  public static readonly indent_min: number = 1;
  public static readonly indent_max: number = 5;
  public static readonly default_tag: HTMLTag = "ul";

  constructor(props: ListBlockProps) {
    super(props);
    this.state = {
      selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: true},
    };
  }

  private shiftLevel(component: EditText, up: boolean) {
    const selection = component.getSelection();

    for (let i = selection.section; i <= selection.section_offset; i++) {
      const element = this.props.block.content?.section_list[i].element;
      if (!element) continue;

      const length = element.length ?? 0;
      if (up && length < ListBlock.indent_max) {
        element.unshift(component.value.element);
      }
      else if (!up && length > ListBlock.indent_min) {
        element.shift();
      }
    }

    this.props.onPageBlockChange(this.props.block);
  };

  private static insertLineBreak(component: EditText) {
    component.insertText(RichTextCharacter.linebreak);
  }

  private static insertParagraph(component: EditText) {
    component.write(new RichTextSection({element: [...component.value.getSection(component.getSelection().section).element]}));
  }

  private static getContent(content?: ListBlockInitializer) {
    const parent = this.parseElement(content?.element);
    const element = parent === "blockquote" ? "blockquote" : "li";
    return new RichText({
      element:      parent,
      section_list: RichTextSection.sanitize(content?.section_list, section => {
        const array = [] as HTMLTag[];

        if ((section instanceof RichTextSection || typeof section === "object" && section.element) && Array.isArray(section.element)) {
          for (let i = 0; i < section.element.length - 1; i++) {
            array.push(parent);
          }
        }
        array.push(element);

        return array;
      }),
    });
  }

  private static parseElement(tag?: HTMLTag) {
    switch (tag) {
      case "blockquote":
      case "ol":
      case "ul":
        return tag;
      default:
        return ListBlock.default_tag;
    }
  }

  public render() {
    const {readonly = true, decoration, block, className, onAlignmentChange, onDecorationChange} = this.props;
    const {selection} = this.state;
    const content = ListBlock.getContent(block.content);
    if (!content?.size && readonly) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <EditText className={classes.join(" ")} readonly={readonly} selection={selection} decoration={decoration} whitelist={ListBlock.whitelist} blacklist={ListBlock.blacklist}
                onFocus={this.eventFocus} onKeyDown={this.eventKeyDown} onSelect={this.eventSelect} onAlignmentChange={onAlignmentChange} onDecorationChange={onDecorationChange}
                onTextChange={this.eventChange}>
        {content}
      </EditText>
    );
  }

  private readonly eventFocus = (event: React.FocusEvent<HTMLDivElement>, component: EditText) => {
    this.props.onEditTextChange(component);
  };

  private readonly eventSelect = (selection: EditTextSelection) => {
    this.setState({selection});
  };

  private readonly eventChange = (content: RichText, selection: EditTextSelection) => {
    this.props.onPageBlockChange(new PageBlockEntity({...this.props.block, content}));
    this.setState({selection});
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, component: EditText) => {
    const delegate = Helper.getKeyboardCommandDelegate(event);
    this.handleKeyDown(delegate, component);

    if (delegate.handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  private readonly handleKeyDown = (delegate: KeyboardCommandDelegate, component: EditText) => {
    delegate.handled = true;

    switch (delegate.command) {
      case KeyboardCommand.INDENT:
      case KeyboardCommand.NEXT_FOCUS:
        return this.shiftLevel(component, true);
      case KeyboardCommand.OUTDENT:
      case KeyboardCommand.PREV_FOCUS:
        return this.shiftLevel(component, false);
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return ListBlock.insertParagraph(component);
      case KeyboardCommand.NEW_PARAGRAPH:
      case KeyboardCommand.NEW_PARAGRAPH_ALT:
        return ListBlock.insertLineBreak(component);
    }

    delegate.handled = false;
  };
}

export type ListBlockContent = RichText
export type ListBlockInitializer = RichText | RichTextInitializer

export interface ListBlockProps extends PageExplorerBlockProps<ListBlockContent> {

}

interface State {
  selection: EditTextSelection;
}


