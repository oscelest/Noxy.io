import React from "react";
import {RichTextDecorationStyle} from "../../../classes/RichText/RichTextDecoration";
import IconType from "../../../enums/IconType";
import Button from "../../Form/Button";
import Component from "../Component";
import Style from "./BlockEditorToolbarStyle.module.scss";

export default class BlockEditorToolbar extends Component<BlockEditorToolbarStyleProps, State> {

  constructor(props: BlockEditorToolbarStyleProps) {
    super(props);
    this.state = {
      dropdown_color:            false,
      dropdown_background_color: false,
    };
  }

  public render() {
    const {className, disabled} = this.props;
    const {bold, italic, underline, strikethrough, code, mark} = this.props.value;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <Button icon={IconType.BOLD} value={{bold: !bold}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button icon={IconType.ITALIC} value={{italic: !italic}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button icon={IconType.STRIKETHROUGH} value={{underline: !underline}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button icon={IconType.UNDERLINE} value={{strikethrough: !strikethrough}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button icon={IconType.CODE_ALT} value={{code: !code}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button icon={IconType.MARKER} value={{mark: !mark}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button icon={IconType.CERTIFICATE} disabled={disabled} onClick={this.eventLinkClick}/>
      </div>
    );
  }

  private readonly eventStyleClick = (decoration: RichTextDecorationStyle) => {
    this.props.onChange(decoration);
  };

  private readonly eventLinkClick = () => {
    // if (!this.state.text) return;
    // this.setState({
    //   dialog: Dialog.show(
    //     <div>
    //       <Input label={"Link"} value={"https://dr.dk"} onChange={() => {}}/>
    //       <Button value={"https://dr.dk"} onClick={this.eventDecorateLinkSubmit}>Add</Button>
    //     </div>,
    //     {
    //       title:   "Add link",
    //       overlay: true,
    //     },
    //   ),
    // });
  };

  // private readonly eventDecorateLinkSubmit = (value: string) => {
    // const element = document.createElement("a");
    // const link = document.createElement("u");
    // element.href = value;
    // link.innerText = value;
    // element.append(link);
    // this.state.focus?.insertHTML(element);
  // };
}

export interface BlockEditorToolbarStyleProps {
  className?: string;
  disabled?: boolean;

  value: RichTextDecorationStyle;

  onChange(decoration: RichTextDecorationStyle): void;
  onPreview(decoration?: RichTextDecorationStyle): void;
}

interface State {
  dialog?: string;

  dropdown_color: boolean;
  dropdown_background_color: boolean;
}
