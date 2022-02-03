import React from "react";
import Component from "../Application/Component";
import EditText, {EditTextSelection} from "../Text/EditText";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import PageBlockType from "../../../common/enums/PageBlockType";
import RichText, {RichTextInitializer} from "../../classes/RichText/RichText";
import RichTextSection from "../../classes/RichText/RichTextSection";
import {PageExplorerBlockProps} from "../Application/BlockEditor/BlockEditor";
import {RichTextDecorationKeys} from "../../classes/RichText/RichTextDecoration";
import Style from "./TextBlock.module.scss";

export default class TextBlock extends Component<TextBlockProps, State> {

  private static readonly blacklist: RichTextDecorationKeys[] = [];
  private static readonly whitelist: RichTextDecorationKeys[] = [];

  constructor(props: TextBlockProps) {
    super(props);
    this.state = {
      selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: true},
    };
  }

  private static getContent(content?: TextBlockInitializer) {
    return new RichText({
      ...content,
      element:      "div",
      section_list: TextBlock.getSectionList(content?.section_list),
    });
  }

  private static getSectionList(list?: TextBlockInitializer["section_list"]) {
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
    const {readonly = true, decoration, className, onAlignmentChange, onDecorationChange} = this.props;
    const {selection} = this.state;

    const text = TextBlock.getContent(this.props.block.content);
    if (!text.size && readonly) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <EditText readonly={readonly} selection={selection} decoration={decoration} whitelist={TextBlock.whitelist} blacklist={TextBlock.blacklist}
                  onFocus={this.eventFocus} onSelect={this.eventSelect} onAlignmentChange={onAlignmentChange} onDecorationChange={onDecorationChange} onTextChange={this.eventTextChange}>
          {text}
        </EditText>
      </div>
    );
  }

  private readonly eventFocus = (event: React.FocusEvent<HTMLDivElement>, component: EditText) => {
    this.props.onEditTextChange(component);
  };

  private readonly eventSelect = (selection: EditTextSelection) => {
    this.setState({selection});
  };

  private readonly eventTextChange = (content: RichText, selection: EditTextSelection) => {
    this.props.onPageBlockChange(new PageBlockEntity({...this.props.block, content}));
    this.setState({selection});
  };
}

type TextBlockInitializer = RichText | RichTextInitializer;

export interface TextBlockProps extends PageExplorerBlockProps<PageBlockContentInitializer[PageBlockType.TEXT]> {

}

interface State {
  selection: EditTextSelection;
}


declare global {
  interface PageBlockContentInitializer {
    [PageBlockType.TEXT]: RichText | RichTextInitializer;
  }

  interface PageBlockContentValue {
    [PageBlockType.TEXT]: RichText;
  }
}
