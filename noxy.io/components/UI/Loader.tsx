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
    if (this.props.value === undefined || this.props.value === false) return this.props.children;
  
    const text = typeof this.props.value === "string" ? this.props.value : "";
    const classes = [Style.Component, this.getSizeClassName()];
    if (this.props.className) classes.push(this.props.className);
  
    return (
      <div className={classes.join(" ")}>
        {this.renderLoader()}
        <Conditional condition={text}>
          <span className={Style.Text}>{text}</span>
        </Conditional>
      </div>
    );
  }
  
  private readonly renderLoader = () => {
    return (
      <svg className={Style.Loader} width="38" height="38" viewBox="0 0 38 38" stroke={this.props.color || "#ffddff"}>
        <g fill="none" fillRule={"evenodd"}>
          <g strokeWidth="12%">
            <circle strokeOpacity=".5" cx="19" cy="19" r="15"/>
            <path d="M34 19c0-9.94-8.06-15-15-15">
              <animateTransform attributeName="transform" type="rotate" from="0 19 19" to="360 19 19" dur="1s" repeatCount="indefinite"/>
            </path>
          </g>
        </g>
      </svg>
    );
  };
}

export interface LoaderProps {
  size?: Size;
  color?: string;
  value?: boolean | string;
  className?: string;
}

interface State {

}
