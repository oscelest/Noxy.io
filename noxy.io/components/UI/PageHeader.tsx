import React from "react";
import Style from "./PageHeader.module.scss";
import Conditional from "../Application/Conditional";

export default class PageHeader extends React.Component<PageHeaderProps, State> {

  constructor(props: PageHeaderProps) {
    super(props);
  }

  public componentDidMount(): void {
    document.title = `${this.props.title} | Noxy.io`;
  }

  public componentDidUpdate(prevProps: Readonly<PageHeaderProps>) {
    if (prevProps.title !== this.props.title) {
      document.title = `${this.props.title} | Noxy.io`;
    }
  }

  public componentWillUnmount(): void {
    document.title = `Noxy.io`;
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
