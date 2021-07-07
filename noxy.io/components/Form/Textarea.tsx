import Component from "../Application/Component";
import Style from "./Textarea.module.scss";
import React from "react";
import FatalException from "../../exceptions/FatalException";

export default class Textarea extends Component<TextareaProps, State> {

  constructor(props: TextareaProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }

  public async componentDidMount() {
    if (!this.state.ref.current) throw new FatalException("Could not load EditorJS component.");
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div ref={this.state.ref} className={classes.join(" ")}>

      </div>
    );
  }

}

interface TextareaProps {
  value: string
  label: string

  className?: string

  onChange?(): void
}

interface State {
  ref: React.RefObject<HTMLDivElement>
}
