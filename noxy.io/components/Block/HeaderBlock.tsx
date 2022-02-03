import React from "react";
import Button from "../Form/Button";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import EditText, {EditTextSelection} from "components/Text/EditText";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import RichText, {RichTextInitializer} from "../../classes/RichText/RichText";
import {RichTextDecorationKeys} from "../../classes/RichText/RichTextDecoration";
import {PageExplorerBlockProps} from "../Application/BlockEditor/BlockEditor";
import Style from "./HeaderBlock.module.scss";
import RichTextSection from "../../classes/RichText/RichTextSection";
import Alignment from "../../../common/enums/Alignment";

export default class HeaderBlock extends Component<HeaderBlockProps, State> {

  private static readonly blacklist: RichTextDecorationKeys[] = ["bold"];
  private static readonly whitelist: RichTextDecorationKeys[] = [];

  public static readonly default_tag: HTMLTag = "h1";

  constructor(props: HeaderBlockProps) {
    super(props);
    this.state = {
      selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: true},
    };
  }

  public replaceContentElement(level: number) {
    if (level < 0 || level > 6) throw new Error("Header block element must be either h1, h2, h3, h4, h5, or h6.");

    const content = new RichText({...this.props.block.content, element: `h${level}` as HTMLTag});
    return new PageBlockEntity<HeaderBlockContent>({...this.props.block, content});
  }

  private static getContent(content?: HeaderBlockInitializer) {
    return new RichText({
      ...content,
      alignment:    content?.alignment ?? Alignment.LEFT,
      element:      this.parseElement(content?.element),
      section_list: this.parseSectionList(content?.section_list),
    });
  }

  private static parseElement(tag?: HTMLTag) {
    switch (tag) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return tag;
      default:
        return HeaderBlock.default_tag;
    }
  }

  private static parseSectionList(list?: HeaderBlockInitializer["section_list"]) {
    if (typeof list === "string") return list;
    if (Array.isArray(list)) {
      const section_list = [];
      for (let i = 0; i < list.length; i++) {
        const item = list.at(i);
        if (!item) continue;
        if (item instanceof RichTextSection) {
          section_list.push(new RichTextSection({...item, element: "p"}));
        }
        else if (typeof item === "string") {
          section_list.push(new RichTextSection({character_list: item}));
        }
        else {
          section_list.push(new RichTextSection({character_list: item?.character_list}));
        }
      }
      return section_list;
    }
    return [new RichTextSection()];
  }

  public render() {
    const {readonly = true, decoration, block, className, onAlignmentChange, onDecorationChange} = this.props;
    const {selection} = this.state;

    const content = HeaderBlock.getContent(block.content);
    if (!content?.size && readonly) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <Conditional condition={!readonly}>
          {this.renderOptionList()}
        </Conditional>
        <EditText readonly={readonly} selection={selection} decoration={decoration} whitelist={HeaderBlock.whitelist} blacklist={HeaderBlock.blacklist}
                  onFocus={this.eventFocus} onSelect={this.eventSelect} onAlignmentChange={onAlignmentChange} onDecorationChange={onDecorationChange} onTextChange={this.eventChange}>
          {content}
        </EditText>
      </div>
    );
  }

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

  private readonly eventHeaderLevelClick = (level: number) => {
    this.props.onPageBlockChange(this.replaceContentElement(level));
  };
}

export type HeaderBlockContent = RichText
export type HeaderBlockInitializer = RichText | RichTextInitializer

export interface HeaderBlockProps extends PageExplorerBlockProps<HeaderBlockContent> {

}

interface State {
  selection: EditTextSelection;
}
