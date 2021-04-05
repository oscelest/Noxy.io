import React from "react";
import Style from "./EllipsisText.module.scss";

export default class EllipsisText extends React.Component<EllipsisTextProps, State> {
  
  constructor(props: EllipsisTextProps) {
    super(props);
    this.state = {};
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <span className={Style.Wrapper}>
          {this.props.children}
        </span>
      </div>
    );
  }
}

export interface EllipsisTextProps {
  className?: string
}

interface State {

}
