import React from "react";
import Style from "./ErrorText.module.scss";
import Component from "../Application/Component";

export default class ErrorText extends Component<ErrorTextProps, State> {
  
  constructor(props: ErrorTextProps) {
    super(props);
    this.state = {};
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <span className={classes.join(" ")}>
        {this.props.children}
      </span>
    );
  }
}

export interface ErrorTextProps {
  className?: string
}

interface State {

}
