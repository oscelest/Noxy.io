import Button from "components/Form/Button";
import React from "react";
import Component from "../Application/Component";
import Style from "./DropdownButton.module.scss";
import IconType from "../../enums/IconType";
import Dropdown from "../Base/Dropdown";

export default class DropdownButton extends Component<DropdownButtonProps, State> {

  constructor(props: DropdownButtonProps) {
    super(props);
    this.state = {
      collapsed: true,
    }
  }

  public render() {
    const {className, icon, text, children} = this.props;
    const {collapsed} = this.state;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <Button icon={icon} onClick={this.eventButtonClick}>{text}</Button>
        <Dropdown className={Style.Dropdown} collapsed={collapsed}>
          {children}
        </Dropdown>
      </div>
    );
  };

  private readonly eventButtonClick = () => {
    this.setState({collapsed: !this.state.collapsed})
  }

}

export interface DropdownButtonProps {
  className?: string

  icon?: IconType
  text?: string
}

interface State {
  collapsed: boolean
}
