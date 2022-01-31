import React from "react";
import {RichTextDecorationColor} from "../../../classes/RichText/RichTextDecoration";
import IconType from "../../../enums/IconType";
import Button from "../../Form/Button";
import Component from "../Component";
import Style from "./BlockEditorToolbarColor.module.scss";
import ColorPicker from "../../Form/ColorPicker";
import Color from "../../../../common/classes/Color";
import Dropdown from "components/Base/Dropdown";
import EventCode from "../../../../common/enums/EventCode";

export default class BlockEditorToolbar extends Component<BlockEditorToolbarColorProps, State> {

  private static color: Color = new Color("#FFFFFFFF");
  private static background_color: Color = new Color("#00000000");

  constructor(props: BlockEditorToolbarColorProps) {
    super(props);
    this.state = {
      ref_color:            React.createRef(),
      ref_background_color: React.createRef(),

      color:            BlockEditorToolbar.color,
      background_color: BlockEditorToolbar.background_color,

      collapsed_color:            true,
      collapsed_background_color: true,
    };
  }

  public render() {
    const {className, disabled} = this.props;
    const {color = this.state.color, background_color = this.state.background_color} = this.props.value;
    const {collapsed_color, collapsed_background_color} = this.state;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")} onKeyDown={this.eventKeyDown}>
        <div className={Style.Color}>
          <Button icon={IconType.FONT} value={!collapsed_color} onClick={this.eventColorDropdown} disabled={disabled}/>
          <Dropdown className={Style.Dropdown} collapsed={collapsed_color}>
            <ColorPicker ref={this.state.ref_color} value={color} onChange={this.eventColorPreview}/>
          </Dropdown>
        </div>

        <div className={Style.Color}>
          <Button icon={IconType.COLOR_BUCKET} value={!collapsed_background_color} onClick={this.eventBackgroundColorDropdown} disabled={disabled}/>
          <Dropdown className={Style.Dropdown} collapsed={collapsed_background_color}>
            <ColorPicker ref={this.state.ref_background_color} value={background_color} onChange={this.eventBackgroundColorPreview}/>
          </Dropdown>
        </div>
      </div>
    );
  }

  private readonly eventKeyDown = (event: React.KeyboardEvent) => {
    const key = event.key as EventCode;
    if (key === EventCode.ESCAPE) {
      this.props.onPreview();
      event.preventDefault();
    }
  };

  private readonly eventColorDropdown = (collapsed_color: boolean) => {
    this.state.ref_color.current?.focus();
    this.setState({collapsed_color, collapsed_background_color: true});
    if (collapsed_color) {
      this.props.onChange({color: this.state.color});
    }
  };

  private readonly eventColorPreview = (color: Color) => {
    this.props.onPreview({color});
    this.setState({color});
  };

  private readonly eventBackgroundColorDropdown = (collapsed_background_color: boolean) => {
    this.state.ref_background_color.current?.focus();
    this.setState({collapsed_background_color, collapsed_color: true});
    if (collapsed_background_color) {
      this.props.onChange({background_color: this.state.background_color});
    }
  };

  private readonly eventBackgroundColorPreview = (background_color: Color) => {
    this.props.onPreview({background_color});
    this.setState({background_color});
  };
}

export interface BlockEditorToolbarColorProps {
  className?: string;
  disabled?: boolean;

  value: RichTextDecorationColor;

  onChange(decoration: RichTextDecorationColor): void;
  onPreview(decoration?: RichTextDecorationColor): void;
}

interface State {
  ref_color: React.RefObject<ColorPicker>;
  ref_background_color: React.RefObject<ColorPicker>;

  color: Color;
  background_color: Color;

  collapsed_color: boolean;
  collapsed_background_color: boolean;
}
