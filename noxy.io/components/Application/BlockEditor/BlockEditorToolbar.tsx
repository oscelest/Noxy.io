import React from "react";
import RichTextDecoration, {RichTextDecorationInitializer} from "../../../classes/RichText/RichTextDecoration";
import EditText from "../../Text/EditText";
import Component from "../Component";
import Style from "./BlockEditorToolbar.module.scss";
import Alignment from "../../../../common/enums/Alignment";
import BlockEditorToolbarAlignment from "./BlockEditorToolbarAlignment";
import BlockEditorToolbarFont from "./BlockEditorToolbarFont";
import BlockEditorToolbarColor from "./BlockEditorToolbarColor";
import BlockEditorToolbarStyle from "./BlockEditorToolbarStyle";

export default class BlockEditorToolbar extends Component<BlockEditorToolbarProps, State> {

  constructor(props: BlockEditorToolbarProps) {
    super(props);
    this.state = {};
  }

  public render() {
    const {className, alignment, decoration, text} = this.props;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <BlockEditorToolbarStyle value={decoration} disabled={!text} onChange={this.eventDecorationChange} onPreview={this.eventDecorationPreview}/>
        <BlockEditorToolbarFont value={decoration} disabled={!text} onChange={this.eventDecorationChange} onPreview={this.eventDecorationPreview}/>
        <BlockEditorToolbarColor value={decoration} disabled={!text} onChange={this.eventDecorationChange} onPreview={this.eventDecorationPreview}/>
        <BlockEditorToolbarAlignment alignment={alignment} disabled={!text} onChange={this.eventAlignmentChange}/>
      </div>
    );
  }

  private readonly eventAlignmentChange = (alignment: Alignment) => {
    this.props.text?.align(alignment);
    this.props.text?.focus();
  };

  private readonly eventDecorationPreview = (decoration: RichTextDecorationInitializer) => {
    this.props.text?.preview(decoration);
    if (!decoration) this.props.text?.focus();
  };

  private readonly eventDecorationChange = (decoration: RichTextDecorationInitializer) => {
    this.props.text?.decorate(decoration);
    this.props.text?.focus();
  };
}

export interface BlockEditorToolbarProps {
  className?: string;
  disabled?: boolean;

  text?: EditText;
  alignment: Alignment;
  decoration: RichTextDecoration;
}

interface State {

}
