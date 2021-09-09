import Component from "components/Application/Component";
import InputType from "enums/InputType";
import React from "react";
import Conditional from "../Application/Conditional";
import Style from "./Input.module.scss";

export default class Input extends Component<InputProps, State> {
  
  constructor(props: InputProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }
  
  public focus() {
    this.state.ref.current?.focus();
  }
  
  public getSelection() {
    return {
      start: this.state.ref.current?.selectionStart ?? 0,
      direction: this.state.ref.current?.selectionDirection ?? "forward",
      end: this.state.ref.current?.selectionEnd ?? 0
    }
  }
  
  public setSelection(start: number | null, end: number | null, direction?: "forward" | "backward" | "none") {
    this.focus();
    this.state.ref.current?.setSelectionRange(start, end, direction)
  }
  
  public render() {
    const label = this.props.label || "\u00a0";
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <label className={classes.join(" ")}>
        <div className={Style.Label}>
          <Conditional condition={this.props.required}>
            <span className={Style.Required}>*</span>
          </Conditional>
          <span>{label}</span>
          <Conditional condition={this.props.error}>
            <span className={Style.Error}> - {this.props.error}</span>
          </Conditional>
        </div>
        <input ref={this.state.ref} className={Style.Value} type={this.props.type} value={this.props.value} autoComplete={this.props.autoComplete}
               onChange={this.eventChange} onClick={this.props.onClick} onBlur={this.props.onBlur} onFocus={this.props.onFocus} onKeyDown={this.props.onKeyDown}/>
      </label>
    );
  }
  
  private readonly eventChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onChange?.(event.target.value, event);
  };
}

export interface InputProps {
  className?: string;
  
  type?: InputType;
  error?: Error;
  value: string;
  label?: string;
  required?: boolean;
  autoComplete?: string;
  
  onBlur?(event: React.FocusEvent): void;
  onFocus?(event: React.FocusEvent): void;
  onClick?(event: React.MouseEvent): void;
  onChange?(value: string, event: React.ChangeEvent<HTMLInputElement>): void;
  onKeyDown?(event: React.KeyboardEvent): void;
}

interface State {
  ref: React.RefObject<HTMLInputElement>;
}
