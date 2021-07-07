import Component from "../Application/Component";
import Style from "./Textarea.module.scss";
import React from "react";

export default class Textarea extends Component<TextareaProps, State> {

  constructor(props: TextareaProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }

  public async componentDidMount() {

  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div ref={this.state.ref} className={classes.join(" ")} contentEditable={true} suppressContentEditableWarning={true}>

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
