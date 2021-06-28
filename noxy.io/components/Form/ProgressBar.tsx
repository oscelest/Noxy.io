import React from "react";
import Style from "./ProgressBar.module.scss";
import Component from "../Application/Component";

export default class ProgressBar extends Component<ProgressBarProps, State> {
  
  constructor(props: ProgressBarProps) {
    super(props);
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    const style = {right: `${100 - (this.props.progress > 100 ? 100 : this.props.progress)}%`} as React.CSSProperties;
    
    return (
      <div className={classes.join(" ")}>
        <div className={Style.Content}>{this.props.children}</div>
        <div className={Style.Fill} style={style}/>
      </div>
    );
  }
  
}

export interface ProgressBarProps {
  className?: string
  progress: number
}

interface State {

}
