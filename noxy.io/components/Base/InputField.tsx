import Component from "components/Application/Component";
import InputType from "enums/InputType";
import React from "react";
import Conditional from "../Application/Conditional";
import Style from "./InputField.module.scss";

export class InputField extends Component<InputFieldProps, State> {
  
  constructor(props: InputFieldProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <label className={classes.join(" ")}>
        <div className={Style.Label}>
          <Conditional condition={this.props.required}>
            <span className={Style.Required}>*</span>
          </Conditional>
          <span>{this.props.label}</span>
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

export interface InputFieldProps {
  className?: string;
  
  type?: InputType;
  error?: Error;
  value: string;
  label: string;
  required?: boolean;
  autoComplete?: string;
  
  onBlur?(event: React.FocusEvent): void;
  onFocus?(event: React.FocusEvent): void;
  onClick?(event: React.MouseEvent): void;
  onChange?(value: string, event: React.ChangeEvent): void;
  onKeyDown?(event: React.KeyboardEvent): void;
}

interface State {
  ref: React.RefObject<HTMLInputElement>;
}
