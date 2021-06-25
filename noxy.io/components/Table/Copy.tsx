import React from "react";
import IconType from "../../enums/IconType";
import Button from "../Form/Button";
import EllipsisText from "../Text/EllipsisText";
import Style from "./Copy.module.scss";
import Component from "../Application/Component";

export default class Copy extends Component<CopyProps, State> {

  constructor(props: CopyProps) {
    super(props);
  }

  private readonly eventClick = () => navigator.clipboard.writeText(this.props.children);

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    const disabled = !this.props.children || this.props.disabled;

    return (
      <div className={classes.join(" ")} data-disabled={disabled}>
        <EllipsisText className={Style.Text}>{this.props.title}</EllipsisText>
        <Button className={Style.Button} icon={IconType.COPY} disabled={disabled} onClick={this.eventClick}/>
      </div>
    );
  }

}

export interface CopyProps {
  title: string
  children: string
  disabled?: boolean
  className?: string
}

interface State {

}
