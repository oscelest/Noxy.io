import React from "react";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import Loader from "./Loader";
import Style from "./PageHeader.module.scss";

export default class PageHeader extends Component<PageHeaderProps, State> {

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
        <Loader className={Style.Loader} value={this.props.loading && "Loading..."}>
          <div className={Style.Title}>
            {this.props.title}
          </div>
          <Conditional condition={this.props.children}>
            {this.props.children}
          </Conditional>
        </Loader>
      </div>
    );
  };

}

export interface PageHeaderProps {
  title: string

  loading?: boolean
  className?: string
}

interface State {

}
