import React from "react";
import Style from "./PageHeader.module.scss";
import Conditional from "../Application/Conditional";

export default class PageHeader extends React.Component<PageHeaderProps, State> {

  constructor(props: PageHeaderProps) {
    super(props);
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <div className={Style.Title}>
          {this.props.title}
        </div>
        <Conditional condition={this.props.children}>
          <div className={Style.Content}>
            {this.props.children}
          </div>
        </Conditional>
      </div>
    );
  };

}

export interface PageHeaderProps {
  title: string

  className?: string
}

interface State {

}
