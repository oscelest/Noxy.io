import React from "react";
import Style from "./TitleText.module.scss";

export default class TitleText extends React.Component<TitleTextProps, State> {
  
  constructor(props: TitleTextProps) {
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

export interface TitleTextProps {
  className?: string
}

interface State {

}
