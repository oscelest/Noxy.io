import React from "react";
import Component from "../Application/Component";
import Style from "./Dropdown.module.scss";

export default class Dropdown extends Component<DropdownProps, State> {
  
  constructor(props: DropdownProps) {
    super(props);
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")} hidden={this.props.collapsed}>
        {this.props.children}
      </div>
    );
  }
}

export interface DropdownProps {
  collapsed: boolean;
  
  className?: string;
}

interface State {

}
