import React from "react";
import Style from "./PageHeader.module.scss";

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
        {this.renderContent()}
      </div>
    );
  };

  private readonly renderContent = () => {
    if (!this.props.children) return null;

    return (
      <div className={Style.Content}>
        {this.props.children}
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
