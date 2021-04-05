import React from "react";
import Style from "./Placeholder.module.scss";

export default class Placeholder extends React.Component<PlaceholderProps, State> {
  
  constructor(props: PlaceholderProps) {
    super(props);
  }
  
  public render() {
    if (!this.props.show) return this.props.children;
    
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>{this.props.text ?? "Placeholder"}</div>
    );
  }
  
}

export interface PlaceholderProps {
  className?: string
  text?: string
  show?: boolean
}

interface State {
  
}
