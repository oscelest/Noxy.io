import Link, {LinkProps} from "next/link";
import Router from "next/router";
import React from "react";
import Style from "./Redirect.module.scss";

export default class Redirect extends React.Component<RedirectProps, State> {

  constructor(props: RedirectProps) {
    super(props);
  }

  public render() {
    const {children, className, ...props} = this.props;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <Link {...props} >
        <a className={classes.join(" ")} onClick={this.eventClick} onDoubleClick={this.eventDoubleClick}>
          {children}
        </a>
      </Link>
    );
  }

  private readonly eventClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (this.props.isDoubleClick) event.preventDefault();
  };

  private readonly eventDoubleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.ctrlKey ? window.open(this.props.href.toString(), "_blank") : Router.router?.push(this.props.href);
  };

}

export interface RedirectProps extends LinkProps {
  className?: string
  isDoubleClick?: boolean
}

interface State {

}
