import React from "react";
import Style from "./HeaderText.module.scss";
import Component from "../Application/Component";

export default class HeaderText extends Component<HeaderTextProps, State> {
  
  constructor(props: HeaderTextProps) {
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

export interface HeaderTextProps {
  className?: string
}

interface State {

}
