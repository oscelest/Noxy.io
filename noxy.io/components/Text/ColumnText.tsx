import React from "react";
import Style from "./ColumnText.module.scss";
import Component from "../Application/Component";

export default class ColumnText extends Component<ColumnTextProps, State> {
  
  constructor(props: ColumnTextProps) {
    super(props);
    this.state = {};
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <span className={Style.Title}>{this.props.title}</span>
        <span className={Style.Text}>{this.props.children}</span>
      </div>
    );
  }
}

export interface ColumnTextProps {
  title: string
  className?: string
}

interface State {

}
