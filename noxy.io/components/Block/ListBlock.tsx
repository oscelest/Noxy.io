import React from "react";
import RichText, {RichTextInitializer} from "../../classes/RichText/RichText";
import RichTextCharacter from "../../classes/RichText/RichTextCharacter";
import RichTextSection from "../../classes/RichText/RichTextSection";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Helper from "../../Helper";
import Component from "../Application/Component";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import EditText, {EditTextCommandList, EditTextSelection} from "../Text/EditText";
import Style from "./ListBlock.module.scss";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import Util from "../../../common/services/Util";

export default class ListBlock extends Component<ListBlockProps, State> {

  private static readonly blacklist: EditTextCommandList = [];
  private static readonly whitelist: EditTextCommandList = [];

  public static readonly indent_min: number = 1;
  public static readonly indent_max: number = 5;
  public static readonly default_tag: HTMLTag = "ul";

  constructor(props: ListBlockProps) {
    super(props);
    this.state = {
      selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: true},
    };
  }

  public replaceContent(old_text: RichText, new_text: RichText) {
    if (this.props.block.content?.id !== old_text.id) throw new Error("Could not find text in HeaderBlock.");

    return new PageBlockEntity({
      ...this.props.block,
      content: new_text,
    });
  }

  private shiftLevel(component: EditText, up: boolean) {
    const selection = component.getSelection();

    for (let i = selection.section; i <= selection.section_offset; i++) {
      const element = this.props.block.content?.section_list[i].element;
      console.log(element);
      if (!element) continue;

      const length = element.length ?? 0;
      if (up && length < ListBlock.indent_max) {
        element.unshift(component.text.element);
      }
      else if (!up && length > ListBlock.indent_min) {
        element.shift();
      }
    }

    this.props.onPageBlockChange(this.props.block);
  };

  private insertLineBreak(component: EditText) {
    component.insertText(RichTextCharacter.linebreak);
  }

  private insertParagraph(component: EditText) {
    component.write(new RichTextSection({element: [...component.text.getSection(component.getSelection().section).element]}));
  }

  private static parseInitializerValue(entity?: PageBlockEntity<ListBlockInitializer>) {
    const parent = this.parseElement(entity?.content?.element);
    return new RichText({
      element:      parent,
      section_list: this.parseSectionList(entity?.content?.section_list, parent),
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

  private static parseSectionList(list?: RichTextInitializer["section_list"], parent: HTMLTag = ListBlock.default_tag) {
    const element = parent === "blockquote" ? "blockquote" : "li";
    const section_list = [] as RichTextSection[];

    if (!list) {
      section_list.push(new RichTextSection({element}));
    }
    else if (typeof list === "string") {
      section_list.push(new RichTextSection({character_list: list, element}));
    }
    else if (Array.isArray(list)) {
      for (let i = 0; i < list.length; i++) {
        const item = list.at(i);
        if (!item) continue;
        if (typeof item === "string") {
          section_list.push(new RichTextSection({character_list: item, element}));
        }
        else {
          section_list.push(new RichTextSection({...item, element: Util.arrayReplace([...item.element].fill(parent, 0, -1), item.element.length - 1, element)}));
        }
      }
    }

    return section_list;
  }

  public componentDidMount() {
    this.props.onPageBlockChange(new PageBlockEntity<ListBlockContent>({
      ...this.props.block,
      content: ListBlock.parseInitializerValue(this.props.block),
    }));
  }

  public render() {
    const {readonly = true, decoration, block, className} = this.props;
    const {selection} = this.state;
    if (!block.content || !block.content?.length && readonly) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <EditText readonly={readonly} selection={selection} decoration={decoration} whitelist={ListBlock.whitelist} blacklist={ListBlock.blacklist}
                  onFocus={this.eventFocus} onSelect={this.eventSelect} onChange={this.eventChange} onKeyDown={this.eventKeyDown}>
          {block.content}
        </EditText>
      </div>
    );
  }

  private readonly eventFocus = (event: React.FocusEvent<HTMLDivElement>, component: EditText) => {
    this.props.onEditTextChange(component);
  };

  private readonly eventSelect = (selection: EditTextSelection, component: EditText) => {
    this.setState({selection});
    this.props.onDecorationChange(component.text.getDecoration(selection));
  };

  private readonly eventChange = (text: RichText, component: EditText) => {
    this.props.onPageBlockChange(this.replaceContent(component.text, text));
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

export type ListBlockContent = RichText
export type ListBlockInitializer = RichText | RichTextInitializer

export interface ListBlockProps extends PageExplorerBlockProps<ListBlockContent> {

}

interface State {
  selection: EditTextSelection;
}


