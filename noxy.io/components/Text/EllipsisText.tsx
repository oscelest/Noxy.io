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
        <abbr className={Style.Wrapper} title={this.props.children}>
          {this.props.children}
        </abbr>
      </div>
    );
  }
}

export interface EllipsisTextProps {
  className?: string
  children: string
}

interface State {

}
