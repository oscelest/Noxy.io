import React from "react";
import {RichTextDecorationStyle} from "../../../classes/RichText/RichTextDecoration";
import IconType from "../../../enums/IconType";
import Button from "../../Form/Button";
import Component from "../Component";
import Style from "./BlockEditorToolbarStyle.module.scss";
import Dropdown from "components/Base/Dropdown";
import Input from "../../Form/Input";

export default class BlockEditorToolbar extends Component<BlockEditorToolbarStyleProps, State> {

  constructor(props: BlockEditorToolbarStyleProps) {
    super(props);
    this.state = {
      ref:            React.createRef(),
      collapsed_link: true,
    };
  }

  public componentWillUnmount(): void {
    window.removeEventListener("click", this.eventLinkBlur);
  }

  private getButtonClass(key: keyof RichTextDecorationStyle) {
    const classes = [Style.Button];
    if (this.props.value[key]) classes.push(Style.Active);
    return classes.join(" ");
  }

  public render() {
    const {ref, collapsed_link} = this.state;
    const {className, disabled} = this.props;
    const {bold, italic, underline, strikethrough, code, mark, link = ""} = this.props.value;

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
        <div className={Style.Link}>
          <Button className={this.getButtonClass("link")} icon={IconType.LINK} disabled={disabled} value={!collapsed_link} onClick={this.eventLinkClick}/>
          <Dropdown className={Style.Dropdown} collapsed={collapsed_link}>
            <Input className={Style.LinkInput} label={"Link"} value={link} onChange={this.eventLinkChange}/>
          </Dropdown>
        </div>
      </div>
    );
  }

  private readonly eventStyleClick = (decoration: RichTextDecorationStyle) => {
    this.props.onChange(decoration);
  };

  private readonly eventLinkChange = (link: string) => {
    this.props.onPreview({link});
  };

  private readonly eventLinkClick = (collapsed_link: boolean) => {
    this.setState({collapsed_link});
    if (!collapsed_link) {
      window.addEventListener("click", this.eventLinkBlur);
    }
    else {
      window.removeEventListener("click", this.eventLinkBlur);
    }
  };

  private readonly eventLinkBlur = (event: MouseEvent) => {
    if (!this.state.ref.current || !event.composedPath().includes(this.state.ref.current)) {
      window.removeEventListener("click", this.eventLinkBlur);
      this.setState({collapsed_link: true});
    }
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
  link?: string;
  dialog?: string;

  collapsed_link: boolean;
}
