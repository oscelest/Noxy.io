import React from "react";
import RichText, {RichTextInitializer} from "../../classes/RichText/RichText";
import Component from "../Application/Component";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import EditText, {EditTextCommandList, EditTextSelection} from "../Text/EditText";
import Style from "./TextBlock.module.scss";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";

export default class TextBlock extends Component<TextBlockProps, State> {

  private static readonly blacklist: EditTextCommandList = [];
  private static readonly whitelist: EditTextCommandList = [];

  constructor(props: TextBlockProps) {
    super(props);
    this.state = {
      selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: true},
    };
  }

  public replaceValue(old_text: RichText, new_text: RichText) {
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
    const {readonly = true, decoration, block, className} = this.props;
    const {selection} = this.state;
    if (!block.content || !block.content?.length && readonly) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <EditText readonly={readonly} selection={selection} decoration={decoration} whitelist={TextBlock.whitelist} blacklist={TextBlock.blacklist}
                  onSelect={this.eventSelect} onChange={this.eventChange} onFocus={this.eventFocus}>
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
    this.props.onPageBlockChange(this.replaceValue(component.text, text));
  };
}

export type TextBlockContent = RichText
export type TextBlockInitializer = RichText | RichTextInitializer

export interface TextBlockProps extends PageExplorerBlockProps<TextBlockContent> {

}

interface State {
  selection: EditTextSelection;
}
