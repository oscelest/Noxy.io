import React from "react";
import Component from "../Application/Component";
import Style from "./ColorPicker.module.scss";
import Input from "./Input";
import Color from "../../../common/classes/Color";
import Point from "../../../common/classes/Point";
import Util from "../../../common/services/Util";
import Conditional from "../Application/Conditional";
import Button from "./Button";

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

  private getFullRGBColor(object?: Pick<Partial<Writeable<Color>>, "red" | "blue" | "green" | "alpha">) {
    const red = object?.red ?? this.props.color?.red ?? 255;
    const green = object?.green ?? this.props.color?.green ?? 255;
    const blue = object?.blue ?? this.props.color?.blue ?? 255;
    const alpha = object?.alpha ?? this.props.color?.alpha ?? 1;
    return new Color({red, green, blue, alpha});
  }

  private getFullHSVColor(object?: Pick<Partial<Writeable<Color>>, "hue" | "saturation" | "value" | "alpha">) {
    const hue = object?.hue ?? this.props.color?.hue ?? 1;
    const saturation = object?.saturation ?? this.props.color?.saturation ?? 1;
    const value = object?.value ?? this.props.color?.value ?? 1;
    const alpha = object?.alpha ?? this.props.color?.alpha ?? 1;
    return new Color({hue, saturation, value, alpha});
  }

  private getColorBySaturationAndValue({x, y}: Point) {
    if (!this.state.ref_window.current) throw new Error("Could not get color");
    const {left, top, width, height} = this.state.ref_window.current.getBoundingClientRect();
    return this.getFullHSVColor({
      ...this.props.color,
      saturation: Util.clamp((x - left) / width, width),
      value:      Util.clamp((1 - (y - top) / height), height),
    });
  }

  private getColorByHue(x: number) {
    if (!this.state.ref_color.current) throw new Error("Could not get color");
    const {left, width} = this.state.ref_color.current.getBoundingClientRect();
    return this.getFullHSVColor({
      ...this.props.color,
      hue: (x - left) / width,
    });
  }

  private getColorByAlpha(x: number) {
    if (!this.state.ref_alpha.current) throw new Error("Could not get color");
    const {left, width} = this.state.ref_alpha.current.getBoundingClientRect();
    return this.getFullHSVColor({
      ...this.props.color,
      alpha: (x - left) / width,
    });
  }

  private getColorPropText() {
    if (this.props.color) {
      return {
        hex:   this.props.color.toHex(),
        red:   this.props.color.red.toString(),
        green: this.props.color.green.toString(),
        blue:  this.props.color.blue.toString(),
        alpha: this.props.color.alpha.toString(),
      };
    }
    return {hex: "", red: "", green: "", blue: "", alpha: ""};
  }

  public componentDidMount(): void {
    if (this.props.color) {
      this.setState({
        hex:   this.props.color.toHex(),
        red:   this.props.color.red.toString(),
        green: this.props.color.green.toString(),
        blue:  this.props.color.blue.toString(),
        alpha: this.props.color.alpha.toString(),
      });
    }
  }

  public componentDidUpdate(prevProps: Readonly<ColorPickerProps>): void {
    const next_state = {} as State;

    if (this.props.color !== prevProps.color) {
      Object.assign(next_state, this.getColorPropText());
    }

    if (Object.keys(next_state).length) this.setState(next_state);
  }

  public render() {
    const color = this.getFullHSVColor(this.props.color);
    const {hex, red, green, blue, alpha} = this.state;

    const alpha_fill_style = {background: `linear-gradient(to right, ${color.toRGBA(0)} 0%, ${color.toRGBA(1)} 100%)`};
    const window_fill_style = {background: `hsl(${color.hue * 360}deg, 100%, 50%)`};
    const cursor_fill_style = {top: `${(1 - color.value) * 100}%`, left: `${color.saturation * 100}%`, background: color.toHex()};
    const preview_fill_style = {background: color.toRGBA()};

    const color_handle_style = {left: `${(color.hue * 100).toFixed(0)}%`};
    const alpha_handle_style = {left: `${alpha ? (+alpha * 100).toFixed(0) : 100}%`};

    const alpha_text = alpha ? (+alpha * 100).toFixed(0) : "";

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <div ref={this.state.ref_window} className={Style.Window} onMouseDown={this.eventWindowMouseDown}>
          <div className={Style.Fill} style={window_fill_style}/>
          <div className={Style.Fill}/>
          <div className={Style.Fill}/>
          <Conditional condition={this.props.color}>
            <div className={Style.Cursor} style={cursor_fill_style}/>
          </Conditional>
        </div>

        <div className={Style.OptionList}>
          <div className={Style.Preview}>
            <div className={Style.Fill} style={preview_fill_style}/>
          </div>
          <div className={Style.SliderList}>
            <div ref={this.state.ref_color} className={Style.Hue} onMouseDown={this.eventColorMouseDown}>
              <div className={Style.Handle} style={color_handle_style}/>
            </div>
            <div ref={this.state.ref_alpha} className={Style.Alpha} onMouseDown={this.eventAlphaMouseDown}>
              <div className={Style.Fill} style={alpha_fill_style}/>
              <div className={Style.Handle} style={alpha_handle_style}/>
            </div>
          </div>
        </div>

        <div className={Style.Input}>
          <Input ref={this.state.ref_hex} className={Style.Hex} label={"Hex"} value={hex} onChange={this.eventHexChange}/>
          <Input className={Style.Color} label={"Red"} value={red} onChange={this.eventRedChange} onWheel={this.eventRedWheel}/>
          <Input className={Style.Color} label={"Green"} value={green} onChange={this.eventGreenChange} onWheel={this.eventGreenWheel}/>
          <Input className={Style.Color} label={"Blue"} value={blue} onChange={this.eventBlueChange} onWheel={this.eventBlueWheel}/>
          <Input className={Style.Alpha} label={"Alpha"} value={alpha_text} onChange={this.eventAlphaChange} onWheel={this.eventAlphaWheel}/>
        </div>

        <div className={Style.Recent}>
          <Button onClick={this.eventColorClear}>Clear</Button>
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

  private readonly eventRedChange = (value: string) => {
    const red = +value;
    if (red >= 0 && red <= 255) {
      this.props.onChange(this.getFullRGBColor({...this.props.color, red}));
    }
    else {
      this.setState({red: value});
    }
  };

  private readonly eventRedWheel = (event: React.WheelEvent) => {
    if (this.props.color?.red !== undefined) {
      if (event.deltaY < 0 && this.props.color.red < 255) {
        return this.props.onChange(this.getFullRGBColor({...this.props.color, red: this.props.color.red + 1}));
      }
      if (event.deltaY > 0 && this.props.color.red > 0) {
        return this.props.onChange(this.getFullRGBColor({...this.props.color, red: this.props.color.red - 1}));
      }
    }
    else {
      return this.props.onChange(this.getFullRGBColor({...this.props.color, red: 255, blue: 0, green: 0}));
    }
  };

  private readonly eventGreenChange = (value: string) => {
    const green = +value;
    if (green >= 0 && green <= 255) {
      this.props.onChange(this.getFullRGBColor({...this.props.color, green}));
    }
    else {
      this.setState({green: value});
    }
  };

  private readonly eventGreenWheel = (event: React.WheelEvent) => {
    if (this.props.color?.green !== undefined) {
      if (event.deltaY < 0 && this.props.color.green < 255) {
        return this.props.onChange(this.getFullRGBColor({...this.props.color, green: this.props.color.green + 1}));
      }
      if (event.deltaY > 0 && this.props.color.green > 0) {
        return this.props.onChange(this.getFullRGBColor({...this.props.color, green: this.props.color.green - 1}));
      }
    }
    else {
      return this.props.onChange(this.getFullRGBColor({...this.props.color, red: 255, blue: 0, green: 0}));
    }
  };

  private readonly eventBlueChange = (value: string) => {
    const blue = +value;
    if (blue >= 0 && blue <= 255) {
      this.props.onChange(this.getFullRGBColor({...this.props.color, blue}));
    }
    else {
      this.setState({green: value});
    }
  };

  private readonly eventBlueWheel = (event: React.WheelEvent) => {
    if (this.props.color?.blue !== undefined) {
      if (event.deltaY < 0 && this.props.color.blue < 255) {
        return this.props.onChange(this.getFullRGBColor({...this.props.color, blue: this.props.color.blue + 1}));
      }
      if (event.deltaY > 0 && this.props.color.blue > 0) {
        return this.props.onChange(this.getFullRGBColor({...this.props.color, blue: this.props.color.blue - 1}));
      }
    }
    else {
      return this.props.onChange(this.getFullRGBColor({...this.props.color, red: 255, blue: 0, green: 0}));
    }
  };

  private readonly eventAlphaChange = (value: string) => {
    const alpha = +value;
    if (alpha >= 0 && alpha <= 100) {
      this.props.onChange(this.getFullRGBColor({...this.props.color, alpha}));
    }
    else {
      this.setState({alpha: value});
    }
  };

  private readonly eventAlphaWheel = (event: React.WheelEvent) => {
    if (this.props.color?.alpha !== undefined) {
      if (event.deltaY < 0 && this.props.color.alpha < 1) {
        return this.props.onChange(this.getFullRGBColor({...this.props.color, alpha: this.props.color.alpha + 0.01}));
      }
      if (event.deltaY > 0 && this.props.color.alpha > 0) {
        return this.props.onChange(this.getFullRGBColor({...this.props.color, alpha: this.props.color.alpha - 0.01}));
      }
    }
    else {
      return this.props.onChange(this.getFullRGBColor({...this.props.color, red: 255, blue: 0, green: 0}));
    }
  };

  private readonly eventWindowMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    this.props.onChange(this.getColorBySaturationAndValue(Point.fromMouseEvent(event.nativeEvent)));

    window.addEventListener("mousemove", this.eventWindowMouseMove);
    window.addEventListener("mouseup", this.eventWindowMouseUp);
    event.preventDefault();
  };

  private readonly eventWindowMouseMove = (event: MouseEvent) => {
    this.props.onChange(this.getColorBySaturationAndValue(Point.fromMouseEvent(event)));
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

  private readonly eventColorClear = () => {
    this.props.onChange();
  }
}

export interface ColorPickerProps {
  className?: string;

  color?: Color;

  onChange(color?: Color): void;
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
