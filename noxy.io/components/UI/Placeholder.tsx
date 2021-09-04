import React from "react";
import Component from "../Application/Component";
import Style from "./Placeholder.module.scss";

export default class Placeholder extends Component<PlaceholderProps, State> {
  
  constructor(props: PlaceholderProps) {
    super(props);
  }
  
  public render() {
    if (this.props.value === undefined || this.props.value === false) return this.props.children;
  
    const text = typeof this.props.value === "string" ? this.props.value : "";
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>{text}</div>
    );
  }
  
}

export interface PlaceholderProps {
  value?: string | boolean
  className?: string
}

interface State {
  
}
