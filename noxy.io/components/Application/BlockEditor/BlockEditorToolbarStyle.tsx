import React from "react";
import {RichTextDecorationStyle} from "../../../classes/RichText/RichTextDecoration";
import IconType from "../../../enums/IconType";
import Button from "../../Form/Button";
import Component from "../Component";
import Style from "./BlockEditorToolbarStyle.module.scss";
import Input from "../../Form/Input";
import DropdownButton from "../../UI/DropdownButton";

export default class BlockEditorToolbar extends Component<BlockEditorToolbarStyleProps, State> {

  constructor(props: BlockEditorToolbarStyleProps) {
    super(props);
    this.state = {
      ref:            React.createRef(),
      ref_link:       React.createRef(),
      collapsed_link: true,
    };
  }

  private getButtonClass(key: keyof RichTextDecorationStyle) {
    const classes = [Style.Button];
    if (this.props.value[key]) classes.push(Style.Active);
    return classes.join(" ");
  }

  public render() {
    const {ref, ref_link, link = this.props.value.link ?? ""} = this.state;
    const {className, disabled} = this.props;
    const {bold, italic, underline, strikethrough, code, mark} = this.props.value;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(" ")}>
        <Button className={this.getButtonClass("bold")} icon={IconType.BOLD} value={{bold: !bold}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button className={this.getButtonClass("italic")} icon={IconType.ITALIC} value={{italic: !italic}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button className={this.getButtonClass("strikethrough")} icon={IconType.STRIKETHROUGH} value={{strikethrough: !strikethrough}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button className={this.getButtonClass("underline")} icon={IconType.UNDERLINE} value={{underline: !underline}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button className={this.getButtonClass("code")} icon={IconType.CODE_ALT} value={{code: !code}} disabled={disabled} onClick={this.eventStyleClick}/>
        <Button className={this.getButtonClass("mark")} icon={IconType.MARKER} value={{mark: !mark}} disabled={disabled} onClick={this.eventStyleClick}/>
        <DropdownButton className={this.getButtonClass("link")} icon={IconType.LINK} disabled={disabled} onOpen={this.eventLinkOpen} onClose={this.eventLinkClose} onDismiss={this.eventLinkDismiss}>
          <Input ref={ref_link} className={Style.LinkInput} label={"Link"} value={link} onChange={this.eventLinkChange}/>
        </DropdownButton>
      </div>
    );
  }

  private readonly eventStyleClick = (decoration: RichTextDecorationStyle) => {
    this.props.onChange(decoration);
  };

  private readonly eventLinkChange = (link: string) => {
    this.setState({link});
    this.props.onPreview({link});
  };

  private readonly eventLinkOpen = () => {
    this.state.ref_link.current?.focus();
  };

  private readonly eventLinkClose = () => {
    this.props.onChange({link: this.state.link || ""});
    this.setState({link: undefined});
  };

  private readonly eventLinkDismiss = () => {
    this.props.onPreview();
    this.setState({link: undefined});
  };
}

export interface BlockEditorToolbarStyleProps {
  className?: string;
  disabled?: boolean;

  value: RichTextDecorationStyle;

  onChange(decoration: RichTextDecorationStyle): void;
  onPreview(decoration?: RichTextDecorationStyle): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
  ref_link: React.RefObject<Input>;

  link?: string;
  dialog?: string;

  collapsed_link: boolean;
}
