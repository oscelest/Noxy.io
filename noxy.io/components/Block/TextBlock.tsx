import React from "react";
import RichText, {RichTextInitializer} from "../../classes/RichText/RichText";
import Component from "../Application/Component";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import EditText, {EditTextSelection} from "../Text/EditText";
import Style from "./TextBlock.module.scss";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import {RichTextDecorationKeys} from "../../classes/RichText/RichTextDecoration";

export default class TextBlock extends Component<TextBlockProps, State> {

  private static readonly blacklist: RichTextDecorationKeys[] = [];
  private static readonly whitelist: RichTextDecorationKeys[] = [];

  constructor(props: TextBlockProps) {
    super(props);
    this.state = {
      selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: true},
    };
  }

  public replaceContent(old_text: RichText, new_text: RichText) {
    if (this.props.block.content?.id !== old_text.id) throw new Error("Could not find text in TextBlock.");

    return new PageBlockEntity({
      ...this.props.block,
      content: new_text,
    });
  }

  private static parseInitializerValue(entity?: PageBlockEntity<TextBlockInitializer>) {
    return new RichText({
      element:      "div",
      section_list: entity?.content?.section_list,
    });
  }

  public componentDidMount() {
    this.props.onPageBlockChange(new PageBlockEntity<TextBlockContent>({
      ...this.props.block,
      content: TextBlock.parseInitializerValue(this.props.block),
    }));
  }

  public render() {
    const {readonly = true, decoration, block, className, onDecorationChange} = this.props;
    const {selection} = this.state;
    if (!block.content || !block.content?.length && readonly) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <EditText className={classes.join(" ")} readonly={readonly} selection={selection} decoration={decoration} whitelist={TextBlock.whitelist} blacklist={TextBlock.blacklist}
                onFocus={this.eventFocus} onSelect={this.eventSelect} onDecorationChange={onDecorationChange} onTextChange={this.eventTextChange}>
        {block.content}
      </EditText>
    );
  }

  private readonly eventFocus = (event: React.FocusEvent<HTMLDivElement>, component: EditText) => {
    this.props.onEditTextChange(component);
  };

  private readonly eventSelect = (selection: EditTextSelection) => {
    this.setState({selection});
  };

  private readonly eventTextChange = (text: RichText, component: EditText) => {
    this.props.onPageBlockChange(this.replaceContent(component.text, text));
  };
}

export type TextBlockContent = RichText
export type TextBlockInitializer = RichText | RichTextInitializer

export interface TextBlockProps extends PageExplorerBlockProps<TextBlockContent> {

}

interface State {
  selection: EditTextSelection;
}
