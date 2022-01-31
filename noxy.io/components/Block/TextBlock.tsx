import React from "react";
import Component from "../Application/Component";
import EditText, {EditTextSelection} from "../Text/EditText";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import RichText, {RichTextInitializer} from "../../classes/RichText/RichText";
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
    const {readonly = true, decoration, block, className, onAlignmentChange, onDecorationChange} = this.props;
    const {selection} = this.state;
    if (!block.content || !block.content?.length && readonly) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <EditText readonly={readonly} selection={selection} decoration={decoration} whitelist={TextBlock.whitelist} blacklist={TextBlock.blacklist}
                          onFocus={this.eventFocus} onSelect={this.eventSelect} onAlignmentChange={onAlignmentChange} onDecorationChange={onDecorationChange} onTextChange={this.eventTextChange}>
          {block.content}
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

export type TextBlockContent = RichText
export type TextBlockInitializer = RichText | RichTextInitializer

export interface TextBlockProps extends PageExplorerBlockProps<TextBlockContent> {

}

interface State {
  selection: EditTextSelection;
}
