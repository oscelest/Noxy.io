import React from "react";
import Component from "../Application/Component";
import Style from "./ColorPicker.module.scss";

export default class ColorPicker extends Component<ColorPickerProps, State> {
  
  constructor(props: ColorPickerProps) {
    super(props);
    this.state = {
      hsv: false,
    };
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <input type={"color"} value={"#ffaaff"} color={"blue"} list={"ice-cream-flavors"} autoComplete={"color"}/>
        <datalist id="ice-cream-flavors">
          <option value="#ffaaff"/>
          <option value="#ffffff"/>
          <option value="#123456"/>
          <option value="#654321"/>
          <option value="#445566"/>
        </datalist>
      </div>
    );
  }
  
}

export interface ColorPickerProps {
  className?: string;
  
  value: string;
}

interface State {
  hsv: boolean;
}
