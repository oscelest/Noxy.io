import React from "react";
import Style from "./EllipsisText.module.scss";
import Component from "../Application/Component";

export default class EllipsisText extends Component<EllipsisTextProps, State> {

  constructor(props: EllipsisTextProps) {
    super(props);
    this.state = {
      ref:  React.createRef(),
      show: false,
    };
  }

  private readonly updateShow = () => {
    if (!this.state.ref.current) return;
    const show = this.state.ref.current?.offsetWidth < this.state.ref.current?.scrollWidth;
    if (show !== this.state.show) this.setState({show});
  };

  public componentDidMount(): void {
    this.updateShow();
  }

  public componentDidUpdate(): void {
    this.updateShow();
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <span ref={this.state.ref} className={Style.Wrapper} title={this.state.show ? this.props.children : ""}>
          {this.props.children}
        </span>
      </div>
    );
  }
}

export interface EllipsisTextProps {
  className?: string
  children: string
}

interface State {
  ref: React.RefObject<HTMLSpanElement>
  show: boolean
}
