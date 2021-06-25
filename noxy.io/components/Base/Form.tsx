import React from "react";
import EventKey from "../../enums/EventKey";
import Conditional from "../Application/Conditional";
import Button from "../Form/Button";
import ErrorText from "../Text/ErrorText";
import Style from "./Form.module.scss";
import Helper from "../../Helper";
import Component from "../Application/Component";

export default class Form extends Component<FormProps, State> {

  constructor(props: FormProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }

  public componentDidMount() {
    if (this.props.focus !== false) {
      const input = this.state.ref.current?.querySelector(`input:not([disabled]), textarea:not([disabled])`) as HTMLInputElement | HTMLTextAreaElement | null;
      if (input) {
        input.focus();
        if (input.getAttribute("type") === "email") {
          input.setAttribute("type", "text");
          Helper.schedule(() => input.setAttribute("type", "email"))
        }
        input.setSelectionRange(input.value.length, input.value.length);
      }
      else {
        (this.state.ref.current?.querySelector("[tabindex]:not([disabled])") as HTMLElement)?.focus();
      }
    }
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div ref={this.state.ref} className={classes.join(" ")} onKeyDown={this.eventKeyDown}>
        <Conditional condition={this.props.error}>
          <ErrorText>{this.props.error instanceof Error ? this.props.error.message : this.props.error}</ErrorText>
        </Conditional>
        {this.props.children}
        <Conditional condition={this.props.onSubmit}>
          <Button className={Style.Submit} loading={this.props.loading} onClick={this.props.onSubmit}>{this.props.submit ?? "Submit"}</Button>
        </Conditional>
      </div>
    );
  }

  private readonly eventKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === EventKey.ENTER) this.props.onSubmit?.();
  };

}

export interface FormProps {
  className?: string
  loading?: boolean
  submit?: string
  error?: Error | string
  focus?: boolean

  onSubmit?(): void
}

interface State {
  ref: React.RefObject<HTMLDivElement>
}
