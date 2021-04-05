import React from "react";
import IconType from "../../enums/components/IconType";
import Icon from "../Base/Icon";
import Style from "./DialogContainer.module.scss";

export default class DialogContainer extends React.Component<DialogContainerProps, State> {

  constructor(props: DialogContainerProps) {
    super(props);
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {this.renderTitle()}
        {this.renderCloseButton()}
        {this.props.children}
      </div>
    );
  }

  private readonly renderTitle = () => {
    if (!this.props.title) return null;

    return (
      <div className={Style.Title}>{this.props.title}</div>
    );
  };

  private readonly renderCloseButton = () => {
    if (!this.props.onClose) return null;

    return (
      <Icon className={Style.Close} type={IconType.CLOSE} onClick={this.props.onClose}/>
    );
  };
}

export interface DialogContainerProps {
  title?: string

  children?: React.ReactChild
  className?: string

  onClose?(event: React.MouseEvent<HTMLDivElement>): void
}

interface State {

}
