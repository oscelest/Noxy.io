import React from "react";
import Style from "./SpoilerText.module.scss";

export default class SpoilerText extends React.Component<SpoilerTextProps, State> {

  constructor(props: SpoilerTextProps) {
    super(props);
    this.state = {
      hidden: true,
    };
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <span className={classes.join(" ")} hidden={this.state.hidden} onClick={this.eventClick}>
        {this.props.children}
      </span>
    );
  }

  private readonly eventClick = () => {
    this.setState({hidden: !this.state.hidden});
  };
}

export interface SpoilerTextProps {
  className?: string
}

interface State {
  hidden: boolean
}
