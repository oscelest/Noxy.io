import React from "react";
import Size from "../../../common/enums/Size";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import Style from "./Loader.module.scss";

export default class Loader extends Component<LoaderProps, State> {
  
  constructor(props: LoaderProps) {
    super(props);
  }
  
  private readonly getSizeClassName = () => {
    switch (this.props.size) {
      case Size.LARGE:
        return Style.Large;
      case Size.NORMAL:
        return Style.Normal;
      case Size.SMALL:
        return Style.Small;
      default:
        return Style.Auto;
    }
  };
  
  public render() {
    if (!this.props.show) return this.props.children;
    
    const classes = [Style.Component, this.getSizeClassName()];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <object className={Style.Loader} type="image/svg+xml" data={"/static/loader.svg"}/>
        <Conditional condition={this.props.text}>
          <span className={Style.Text}>{this.props.text}</span>
        </Conditional>
      </div>
    );
  }
}

export interface LoaderProps {
  className?: string
  show?: boolean
  text?: string
  size?: Size
}

interface State {

}
