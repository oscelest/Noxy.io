import React from "react";
import Component from "../Application/Component";
import Style from "./ColorPicker.module.scss";
import Input from "./Input";
import Color from "../../../common/classes/Color";
import Point from "../../../common/classes/Point";
import Util from "../../../common/services/Util";

export default class ColorPicker extends Component<ColorPickerProps, State> {

  constructor(props: ColorPickerProps) {
    super(props);
    this.state = {
      ref_window: React.createRef(),
      ref_color:  React.createRef(),
      ref_alpha:  React.createRef(),
      ref_hex:    React.createRef(),

      cursor: new Point(0, 0),

      hex:   "",
      red:   "",
      green: "",
      blue:  "",
      alpha: "",
    };
  }

  public focus() {
    this.state.ref_hex.current?.focus();
  }

  private getColorBySaturationAndLevel({x, y}: Point) {
    if (!this.state.ref_window.current) throw new Error("Could not get color");
    const {left, top, width, height} = this.state.ref_window.current.getBoundingClientRect();
    const {hue, alpha} = this.props.value;
    const saturation = Util.clamp((x - left) / width, width);
    const value = Util.clamp((1 - (y - top) / height), height);

    return new Color({hue, saturation, value, alpha});
  }

  private getColorByHue(x: number) {
    if (!this.state.ref_color.current) throw new Error("Could not get color");
    const {left, width} = this.state.ref_color.current.getBoundingClientRect();
    const {saturation, value, alpha} = this.props.value;
    const hue = (x - left) / width;

    return new Color({hue, saturation, value, alpha});
  }

  private getColorByAlpha(x: number) {
    if (!this.state.ref_alpha.current) throw new Error("Could not get color");
    const {left, width} = this.state.ref_alpha.current.getBoundingClientRect();
    const {hue, saturation, value} = this.props.value;
    const alpha = (x - left) / width;

    return new Color({hue, saturation, value, alpha});
  }

  private getColorPropText() {
    return {
      hex:   this.props.value.toHex(),
      red:   this.props.value.red.toString(),
      green: this.props.value.green.toString(),
      blue:  this.props.value.blue.toString(),
      alpha: this.props.value.alpha.toString(),
    };
  }

  public componentDidMount(): void {
    const next_state = {...this.getColorPropText()} as State;

    this.setState(next_state);
  }

  public componentDidUpdate(prevProps: Readonly<ColorPickerProps>, prevState: Readonly<State>, snapshot?: any): void {
    const next_state = {} as State;

    if (this.props.value !== prevProps.value) {
      Object.assign(next_state, this.getColorPropText());
    }

    if (Object.keys(next_state).length) this.setState(next_state);
  }

  public render() {
    const {hue} = this.props.value;
    const {hex, red, green, blue, alpha} = this.state;

    const window_style = {background: new Color({hue, saturation: 1, value: 1, alpha: 1}).toHex()};
    const cursor_style = {top: `calc(${(1 - this.props.value.value) * 100}% - 5px)`, left: `calc(${this.props.value.saturation * 100}% - 5px)`, background: this.props.value.toHex()};

    const color_handle_style = {left: `calc(${this.props.value.hue * 100}% - 2px)`};

    const alpha_style = {background: `linear-gradient(to right, ${this.props.value.toRGBA(0)} 0%, ${this.props.value.toRGBA(1)} 100%)`};
    const alpha_handle_style = {left: `calc(${this.props.value.alpha * 100}% - 2.5px)`};

    const preview = {background: this.props.value.toRGBA()};

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <div ref={this.state.ref_window} className={Style.Window} onMouseDown={this.eventWindowMouseDown}>
          <div className={Style.Fill} style={window_style}/>
          <div className={Style.Fill}/>
          <div className={Style.Fill}/>
          <div className={Style.Cursor} style={cursor_style}/>
        </div>

        <div className={Style.OptionList}>
          <div className={Style.Preview}>
            <div className={Style.Fill} style={preview}/>
          </div>
          <div className={Style.SliderList}>
            <div ref={this.state.ref_color} className={Style.Hue} onMouseDown={this.eventColorMouseDown}>
              <div className={Style.Handle} style={color_handle_style}/>
            </div>
            <div ref={this.state.ref_alpha} className={Style.Alpha} onMouseDown={this.eventAlphaMouseDown}>
              <div className={Style.Fill} style={alpha_style}/>

              <div className={Style.Handle} style={alpha_handle_style}/>
            </div>
          </div>
        </div>

        <div className={Style.Input}>
          <Input ref={this.state.ref_hex} className={Style.Hex} label={"Hex"} value={hex} onChange={this.eventHexChange}/>
          <Input className={Style.Color} label={"Red"} value={red} onChange={this.eventRedChange} onWheel={this.eventRedWheel}/>
          <Input className={Style.Color} label={"Green"} value={green} onChange={this.eventGreenChange} onWheel={this.eventGreenWheel}/>
          <Input className={Style.Color} label={"Blue"} value={blue} onChange={this.eventBlueChange} onWheel={this.eventBlueWheel}/>
          <Input className={Style.Alpha} label={"Alpha"} value={(+alpha * 100).toFixed(0)} onChange={this.eventAlphaChange} onWheel={this.eventAlphaWheel}/>
        </div>

        <div className={Style.Recent}>


        </div>
        <div className={Style.Preset}>

        </div>
      </div>
    );
  }

  private readonly eventHexChange = (hex: string) => {
    if (hex.match(/^#[A-F0-9]{6}$/i)) {
      this.props.onChange(new Color(hex));
    }
    else {
      this.setState({hex: hex.toUpperCase()});
    }
  };

  private readonly eventRedChange = (red: string) => {
    const {green, blue, alpha} = this.props.value;
    const value = +red;
    if (value >= 0 && value <= 255) {
      this.props.onChange(new Color({red: +value, green, blue, alpha}));
    }
    else {
      this.setState({red});
    }
  };

  private readonly eventRedWheel = (event: React.WheelEvent) => {
    let {red, green, blue, alpha} = this.props.value;
    if (event.deltaY < 0 && red < 255) red += 1;
    if (event.deltaY > 0 && red > 0) red -= 1;
    if (red !== this.props.value.red) {
      this.props.onChange(new Color({red, green, blue, alpha}));
      this.setState({red: `${red}`});
    }
  };

  private readonly eventGreenChange = (green: string) => {
    const {red, blue, alpha} = this.props.value;
    const value = +green;
    if (value >= 0 && value <= 255) {
      this.props.onChange(new Color({red, green: value, blue, alpha}));
    }
    else {
      this.setState({green});
    }
  };

  private readonly eventGreenWheel = (event: React.WheelEvent) => {
    let {red, green, blue, alpha} = this.props.value;
    if (event.deltaY < 0 && green < 255) green += 1;
    if (event.deltaY > 0 && green > 0) green -= 1;
    if (green !== this.props.value.green) {
      this.props.onChange(new Color({red, green, blue, alpha}));
      this.setState({green: `${green}`});
    }
  };

  private readonly eventBlueChange = (blue: string) => {
    const {red, green, alpha} = this.props.value;
    const value = +blue;
    if (value >= 0 && value <= 255) {
      this.props.onChange(new Color({red, green, blue: value, alpha}));
    }
    else {
      this.setState({blue});
    }
  };

  private readonly eventBlueWheel = (event: React.WheelEvent) => {
    let {red, green, blue, alpha} = this.props.value;
    if (event.deltaY < 0 && blue < 255) blue += 1;
    if (event.deltaY > 0 && blue > 0) blue -= 1;
    if (blue !== this.props.value.blue) {
      this.props.onChange(new Color({red, green, blue, alpha}));
      this.setState({blue: `${blue}`});
    }
  };

  private readonly eventAlphaChange = (alpha: string) => {
    const {red, green, blue} = this.props.value;
    const value = +alpha;
    if (value >= 0 && value <= 255) {
      this.props.onChange(new Color({red, green, blue, alpha: value}));
    }
    else {
      this.setState({alpha});
    }
  };

  private readonly eventAlphaWheel = (event: React.WheelEvent) => {
    let {red, green, blue, alpha} = this.props.value;
    if (event.deltaY < 0 && alpha < 1) alpha += 0.01;
    if (event.deltaY > 0 && alpha > 0) alpha -= 0.01;
    if (alpha !== this.props.value.alpha) {
      this.props.onChange(new Color({red, green, blue, alpha}));
      this.setState({alpha: `${alpha}`});
    }
  };

  private readonly eventWindowMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    this.props.onChange(this.getColorBySaturationAndLevel(Point.fromMouseEvent(event.nativeEvent)));

    window.addEventListener("mousemove", this.eventWindowMouseMove);
    window.addEventListener("mouseup", this.eventWindowMouseUp);
    event.preventDefault();
  };

  private readonly eventWindowMouseMove = (event: MouseEvent) => {
    this.props.onChange(this.getColorBySaturationAndLevel(Point.fromMouseEvent(event)));
    event.preventDefault();
  };

  private readonly eventWindowMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    window.removeEventListener("mousemove", this.eventWindowMouseMove);
    window.removeEventListener("mouseup", this.eventWindowMouseUp);
  };

  private readonly eventColorMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    this.props.onChange(this.getColorByHue(event.pageX));

    window.addEventListener("mousemove", this.eventColorMouseMove);
    window.addEventListener("mouseup", this.eventColorMouseUp);
    event.preventDefault();
  };

  private readonly eventColorMouseMove = (event: MouseEvent) => {
    this.props.onChange(this.getColorByHue(event.pageX));
    event.preventDefault();
  };

  private readonly eventColorMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    window.removeEventListener("mousemove", this.eventColorMouseMove);
    window.removeEventListener("mouseup", this.eventColorMouseUp);
  };

  private readonly eventAlphaMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    this.props.onChange(this.getColorByAlpha(event.pageX));

    window.addEventListener("mousemove", this.eventAlphaMouseMove);
    window.addEventListener("mouseup", this.eventAlphaMouseUp);
    event.preventDefault();
  };

  private readonly eventAlphaMouseMove = (event: MouseEvent) => {
    this.props.onChange(this.getColorByAlpha(event.pageX));
    event.preventDefault();
  };

  private readonly eventAlphaMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    window.removeEventListener("mousemove", this.eventAlphaMouseMove);
    window.removeEventListener("mouseup", this.eventAlphaMouseUp);
  };
}

export interface ColorPickerProps {
  className?: string;

  value: Color;

  onChange(color: Color): void;
}

interface State {
  ref_window: React.RefObject<HTMLDivElement>;
  ref_color: React.RefObject<HTMLDivElement>;
  ref_alpha: React.RefObject<HTMLDivElement>;
  ref_hex: React.RefObject<Input>;

  cursor: Point;

  hex: string;
  red: string;
  green: string;
  blue: string;
  alpha: string;
}
