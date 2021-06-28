import Link, {LinkProps} from "next/link";
import Router from "next/router";
import React from "react";
import Style from "./Redirect.module.scss";
import Component from "./Component";

export default class Redirect extends Component<RedirectProps, State> {

  constructor(props: RedirectProps) {
    super(props);
    this.state = {};
  }

  public render() {
    const {children, className, isDoubleClick, ...props} = this.props;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <Link {...props} >
        {
          isDoubleClick
            ? <div className={classes.join(" ")} onClick={this.eventClick} onDoubleClick={this.eventDoubleClick}>{children}</div>
            : <a className={classes.join(" ")}>{children}</a>
        }
      </Link>
    );
  }

  private readonly eventClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  private readonly eventDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.ctrlKey ? window.open(this.props.href.toString(), "_blank") : Router.router?.push(this.props.href);
  };

}

export interface RedirectProps extends LinkProps {
  className?: string
  isDoubleClick?: boolean
}

interface State {

}
