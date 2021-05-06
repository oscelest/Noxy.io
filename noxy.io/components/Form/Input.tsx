import _ from "lodash";
import React from "react";
import Direction from "../../enums/Direction";
import EventKey from "../../enums/EventKey";
import InputType from "../../enums/InputType";
import FatalException from "../../exceptions/FatalException";
import Dropdown from "../Base/Dropdown";
import Select from "../Base/Select";
import Style from "./Input.module.scss";


export default class Input<T extends string | number = string> extends React.Component<InputProps<T>, State> {

  constructor(props: InputProps<T>) {
    super(props);
    this.state = {
      ref_input: React.createRef(),

      index:    -1,
      focus:    false,
      hover:    false,
      dropdown: false,
    };
  }

  public getSelection = () => {
    if (!this.state.ref_input.current) throw new FatalException("Could not get selection", "Input field has not yet been initialized.");
    const {selectionStart, selectionEnd, selectionDirection} = this.state.ref_input.current;
    return {start: selectionStart ?? 0, end: selectionEnd ?? 0, direction: selectionDirection ?? "none"};
  };

  public setSelection = (start: number, end: number, direction?: "forward" | "backward" | "none") => {
    if (!this.state.ref_input.current) throw new FatalException("Could not get selection", "Input field has not yet been initialized.");
    this.state.ref_input.current.setSelectionRange(start, end, direction);
  };

  public moveCursor = (direction: Direction.UP | Direction.DOWN) => {
    const index = this.props.index ?? this.state.index;
    const offset = direction === Direction.UP ? -1 : 1;
    const next_state = {index: 0, dropdown: true};

    if (Array.isArray(this.props.children) && this.props.children.length !== 1) {
      if (this.props.children.length === 0) {
        next_state.index = -1;
      }
      else if (index === -1) {
        next_state.index = direction === Direction.UP ? this.props.children.length - 1 : 0;
      }
      else {
        next_state.index = (this.props.children.length + index + offset) % this.props.children.length;
      }
    }

    this.setState(next_state);
    this.props.onIndexChange?.(next_state.index);
  };

  public readonly select = (index: number = this.props.index ?? this.state.index, state: Partial<State> = {}) => {
    if (index > -1) {
      this.setState({...state, dropdown: false} as State);

      if (this.props.onIndexCommit) {
        return this.props.onIndexCommit?.(index);
      }

      const text = Array.isArray(this.props.children) ? this.getInnerText(this.props.children[index] as JSX.Element) : this.props.children?.toString() ?? "";
      this.props.onChange((this.props.value === undefined || this.props.value === "" || Number.isNaN(+text) ? text : +text) as T);
    }
  };

  private readonly getInnerText = (element: JSX.Element): string => {
    if (Array.isArray(element.props.children)) return _.filter(_.map(element.props.children, child => this.getInnerText(child))).join(" ");
    if (typeof element.props.children === "object") return this.getInnerText(element.props.children as JSX.Element);
    return element.props.children;
  };

  public render = () => {
    const {ref_input, focus, hover} = this.state;
    const {error, className, autoComplete} = this.props;

    const value = this.props.value ?? "";
    const label = this.props.error ? `${this.props.label} - ${this.props.error.message}` : this.props.label;
    const type = this.props.type ?? InputType.TEXT;
    const size = this.props.size ?? 1;
    const active = (!!error || focus || hover || value !== "");

    const classes = [Style.Component];
    if (className) classes.push(className);

    const label_classes = [Style.Label];
    if (error) label_classes.push(Style.Error);

    return (
      <div className={classes.join(" ")} datatype={type} data-active={active} data-hover={hover} data-focus={focus} onMouseEnter={this.eventMouseEnter} onMouseLeave={this.eventMouseLeave}>
        <label className={Style.Wrapper}>
          <div className={label_classes.join(" ")}>{label}</div>
          <input ref={ref_input} className={Style.Value} type={type} value={value} autoComplete={autoComplete} size={size}
                 onChange={this.eventInputChange} onBlur={this.eventInputBlur} onFocus={this.eventInputFocus} onKeyDown={this.eventKeyDown}/>
        </label>
        {this.renderDropdown()}
      </div>
    );
  };

  private readonly renderDropdown = () => {
    if (!this.props.loading && (!this.props.children || (Array.isArray(this.props.children) && !this.props.children.length) || !this.state.focus || !this.props.value)) return null;

    const index = this.props.index ?? this.state.index;

    return (
      <Dropdown className={Style.Dropdown} hidden={!this.state.dropdown} loading={this.props.loading} placeholder={this.props.placeholder}>
        <Select className={Style.Select} index={index} onChange={this.eventSelectChange} onCommit={this.eventSelectCommit}>
          {this.props.children}
        </Select>
      </Dropdown>
    );
  };

  private readonly eventMouseEnter = () => this.setState({hover: true});
  private readonly eventMouseLeave = () => this.setState({hover: false});

  private readonly eventInputFocus = () => this.setState({focus: true});
  private readonly eventInputBlur = () => {
    this.setState({focus: false, dropdown: false});
    this.props.onReset?.();
  };

  private readonly eventInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const str = event.target.value;
    const num = +event.target.value;
    const value = (str === "" || typeof this.props.value === "string" || Number.isNaN(num) ? str : num) as T;
    const next_state = {dropdown: str !== ""} as State;

    if (this.props.index !== undefined) {
      next_state.index = _.findIndex(_.concat(this.props.children), (element, index) => {
        if (this.props.onCompare) {
          return this.props.onCompare(value, index);
        }
        if (typeof element === "object") {
          return this.getInnerText(element as JSX.Element).toLowerCase() === str.toLowerCase();
        }
        return element?.toString().toLowerCase() === str.toLowerCase();
      });
    }

    this.setState(next_state);
    this.props.onChange(value);
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent) => {
    if (!this.props.children) return;

    switch (event.key as EventKey) {
      case EventKey.ARROW_UP:
        this.moveCursor(Direction.UP);
        break;
      case EventKey.ARROW_DOWN:
        this.moveCursor(Direction.DOWN);
        break;
      case EventKey.ENTER:
      case EventKey.TAB:
        return this.select();
      case EventKey.ESCAPE:
        return this.state.ref_input.current?.blur();
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  private readonly eventSelectChange = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.currentTarget.scrollIntoView({behavior: "auto", block: "nearest", inline: "nearest"});
    this.setState({index});
    this.props.onIndexChange?.(index);
  };

  private readonly eventSelectCommit = (index: number) => {
    this.select(index, {hover: false});
  };
}

export interface InputProps<T extends string | number = string> {
  type?: InputType
  label: string
  error?: Error
  value?: T
  index?: number
  loading?: boolean
  placeholder?: string

  size?: number
  className?: string
  autoComplete?: string

  onReset?: () => void
  onChange: (input: T) => void
  onCompare?: (input: T, index: number) => boolean
  onIndexChange?: (index: number) => void
  onIndexCommit?: (index: number) => void
}


interface State {
  index: number
  focus: boolean
  hover: boolean
  dropdown: boolean

  ref_input: React.RefObject<HTMLInputElement>
}
