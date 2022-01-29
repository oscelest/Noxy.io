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

  public blur() {
    this.state.ref.current?.blur();
  }


  public getSelection() {
    const {current} = this.state.ref;

    return {
      start:     current?.selectionStart ?? 0,
      direction: current?.selectionDirection ?? "forward",
      end:       current?.selectionEnd ?? 0,
    };
  }

  public setSelection(start: number | null, end: number | null, direction?: "forward" | "backward" | "none") {
    this.focus();
    this.state.ref.current?.setSelectionRange(start, end, direction);
  }

  public render() {
    const {ref} = this.state;
    const {label = "\u00a0", className, disabled, required, error, type, value, autoComplete} = this.props;
    const {onKeyDown, onSelect, onBlur, onFocus, onClick, onWheel} = this.props;

    const classes = [Style.Component];
    if (className) classes.push(className);
    if (disabled) classes.push(Style.Disabled);

    return (
      <div className={classes.join(" ")}>
        <div className={Style.Label}>
          <Conditional condition={required}>
            <span className={Style.Required}>*</span>
          </Conditional>
          <span>{label}</span>
          <Conditional condition={error}>
            <span className={Style.Error}> - {error}</span>
          </Conditional>
        </div>
        <input ref={ref} className={Style.Value} type={type} value={value} disabled={disabled} autoComplete={autoComplete}
               onChange={this.eventChange} onClick={onClick} onBlur={onBlur} onFocus={onFocus} onSelect={onSelect} onKeyDown={onKeyDown} onWheel={onWheel}/>
      </div>
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
  disabled?: boolean;
  autoComplete?: string;

  onBlur?(event: React.FocusEvent): void;
  onFocus?(event: React.FocusEvent): void;
  onClick?(event: React.MouseEvent): void;
  onWheel?(event: React.WheelEvent): void;
  onSelect?(event: React.SyntheticEvent<HTMLInputElement>): void;
  onChange?(value: string, event: React.ChangeEvent<HTMLInputElement>): void;
  onKeyDown?(event: React.KeyboardEvent): void;
}

interface State {
  ref: React.RefObject<HTMLInputElement>;
}
