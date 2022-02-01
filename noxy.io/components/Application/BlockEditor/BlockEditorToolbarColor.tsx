import React from "react";
import {RichTextDecorationColor} from "../../../classes/RichText/RichTextDecoration";
import IconType from "../../../enums/IconType";
import Component from "../Component";
import Style from "./BlockEditorToolbarColor.module.scss";
import ColorPicker from "../../Form/ColorPicker";
import Color from "../../../../common/classes/Color";
import EventCode from "../../../../common/enums/EventCode";
import DropdownButton from "../../UI/DropdownButton";

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
    };
  }

  public render() {
    const {className, disabled} = this.props;
    const {color = this.state.color, background_color = this.state.background_color} = this.props.value;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")} onKeyDown={this.eventKeyDown}>
        <DropdownButton icon={IconType.FONT} disabled={disabled} onOpen={this.eventColorOpen} onClose={this.eventColorClose} onDismiss={this.eventColorDismiss}>
          <ColorPicker ref={this.state.ref_color} value={color} onChange={this.eventColorPreview}/>
        </DropdownButton>
        <DropdownButton icon={IconType.COLOR_BUCKET} disabled={disabled} onOpen={this.eventBackgroundColorOpen} onClose={this.eventBackgroundColorClose} onDismiss={this.eventBackgroundColorDismiss}>
          <ColorPicker ref={this.state.ref_background_color} value={background_color} onChange={this.eventBackgroundColorPreview}/>
        </DropdownButton>
      </div>
    );
  }

  private readonly eventKeyDown = (event: React.KeyboardEvent) => {
    const key = event.key as EventCode;
    if (key === EventCode.ESCAPE) {
      event.preventDefault();
      this.props.onPreview();
      this.setState({
        color:            this.props.value.color ?? BlockEditorToolbar.color,
        background_color: this.props.value.background_color ?? BlockEditorToolbar.background_color,
      });
    }
  };

  //region ----- Color handlers -----

  private readonly eventColorPreview = (color: Color) => {
    this.props.onPreview({color});
    this.setState({color});
  };

  private readonly eventColorOpen = () => {
    this.state.ref_color.current?.focus();
  };

  private readonly eventColorClose = () => {
    this.props.onChange({color: this.state.color});
    this.setState({color: this.state.color});
  };

  private readonly eventColorDismiss = () => {
    this.props.onPreview();
    this.setState({color: this.props.value.color ?? BlockEditorToolbar.color});
  };

  //endregion ----- Color handlers -----

  //region    ----- Background Color handlers -----

  private readonly eventBackgroundColorPreview = (background_color: Color) => {
    this.props.onPreview({background_color});
    this.setState({background_color});
  };

  private readonly eventBackgroundColorOpen = () => {
    this.state.ref_background_color.current?.focus();
  };

  private readonly eventBackgroundColorClose = () => {
    this.props.onChange({background_color: this.state.background_color});
    this.setState({background_color: this.state.background_color});
  };

  private readonly eventBackgroundColorDismiss = () => {
    this.props.onPreview();
    this.setState({background_color: this.props.value.background_color ?? BlockEditorToolbar.background_color});
  };

  //endregion ----- Background Color handlers -----

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
}
