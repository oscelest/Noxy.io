import React from "react";
import Size from "../../enums/components/Size";
import Style from "./Loader.module.scss";

export default class Loader extends React.Component<LoaderProps, State> {
  
  constructor(props: LoaderProps) {
    super(props);
  }
  
  private readonly getSizeClassName = () => {
    switch (this.props.size) {
      case Size.LARGE:
        return Style.Large;
      case Size.SMALL:
        return Style.Small;
      default:
        return Style.Normal;
    }
  };
  
  public render() {
    if (!this.props.show) return this.props.children;
    
    const classes = [Style.Component, this.getSizeClassName()];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <object className={Style.Loader} type="image/svg+xml" data={"/static/loader.svg"}/>
        {this.renderText()}
      </div>
    );
  }
  
  private readonly renderText = () => {
    if (!this.props.text) return;
    
    return (
      <span className={Style.Text}>{this.props.text}</span>
    );
  };
  
}

export interface LoaderProps {
  className?: string
  show?: boolean
  text?: string
  size?: Size
}

interface State {

}
