import _ from "lodash";
import React from "react";
import Direction from "../../../common/enums/Direction";
import EventCode from "../../../common/enums/EventCode";
import InputType from "../../enums/InputType";
import FatalException from "../../exceptions/FatalException";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import Dropdown from "../Base/Dropdown";
import Select from "../Base/Select";
import Style from "./Input.module.scss";

export default class Input<T extends string | number = string> extends Component<InputProps<T>, State> {

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

  public get element() {
    return this.state.ref_input.current;
  }

  public getSelection = () => {
    if (!this.state.ref_input.current) throw new FatalException("Could not get selection", "Input field has not yet been initialized.");
    const {selectionStart, selectionEnd, selectionDirection} = this.state.ref_input.current;
    return {start: selectionStart ?? 0, end: selectionEnd ?? 0, direction: selectionDirection ?? "none"};
  };

  public setSelection = (start?: number, end?: number, direction: "forward" | "backward" | "none" = "forward") => {
    if (!this.state.ref_input.current) throw new FatalException("Could not get selection", "Input field has not yet been initialized.");
    this.state.ref_input.current.setSelectionRange(start ?? 0, end ?? start ?? 0, direction);
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

  private readonly getInnerText = (element: React.ReactElement): string => {
    if (Array.isArray(element.props.children)) return _.filter(_.map(element.props.children, child => this.getInnerText(child))).join(" ");
    if (typeof element.props.children === "object") return this.getInnerText(element.props.children as JSX.Element);
    return element.props.children;
  };

  private readonly parseValue = (value: string) => {
    switch (typeof this.props.value) {
      case "string":
        return value;
      case "number":
        if (value === "") return NaN;
        if (isNaN(+value)) return this.props.value;
        return +value;
      default:
        return "";
    }
  };

  public render = () => {
    const {ref_input, focus, hover, dropdown} = this.state;
    const {error, className, autoComplete, placeholder, loading, children} = this.props;

    const value = this.props.value !== undefined && (typeof this.props.value !== "number" || !isNaN(this.props.value)) ? this.props.value : "";
    const label = this.props.error?.message ? `${this.props.label} - ${this.props.error.message}` : this.props.label;
    const type = this.props.type ?? InputType.TEXT;
    const size = this.props.size ?? 1;
    const active = (!!error || focus || hover || value !== "");
    const index = this.props.index ?? this.state.index;

    const classes = [Style.Component];
    if (className) classes.push(className);

    const label_classes = [Style.Label];
    if (error) label_classes.push(Style.Error);

    return (
      <div className={classes.join(" ")} datatype={type} data-active={active} data-hover={hover} data-focus={focus} onMouseEnter={this.eventMouseEnter} onMouseLeave={this.eventMouseLeave}>
        <label className={Style.Wrapper}>
          <div className={label_classes.join(" ")}>
            <Conditional condition={this.props.required}>
              <span className={Style.Required}>*</span>
            </Conditional>
            {label}
          </div>
          <input ref={ref_input} className={Style.Value} type={type} value={value} autoComplete={autoComplete} size={size}
                 onChange={this.eventInputChange} onBlur={this.eventInputBlur} onFocus={this.eventInputFocus} onKeyDown={this.eventKeyDown}/>
        </label>
        <Conditional condition={this.props.loading || React.Children.toArray(this.props.children).length || this.state.focus || this.props.value}>
          <Dropdown className={Style.Dropdown} collapsed={!dropdown} loading={loading} placeholder={placeholder}>
            <Select className={Style.Select} index={index} onChange={this.eventSelectChange} onCommit={this.eventSelectCommit}>
              {children}
            </Select>
          </Dropdown>
        </Conditional>
      </div>
    );
  };

  private readonly eventMouseEnter = () => {
    this.setState({hover: true});
  };

  private readonly eventMouseLeave = () => {
    this.setState({hover: false});
  };

  private readonly eventInputFocus = () => {
    this.setState({focus: true});
  };

  private readonly eventInputBlur = () => {
    this.setState({focus: false, dropdown: false});
    this.props.onReset?.();
  };

  private readonly eventInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = this.parseValue(event.target.value) as T;
    const next_state = {dropdown: value !== ""} as State;

    if (this.props.index !== undefined) {
      next_state.index = _.findIndex(_.concat(this.props.children), (element, index) => {
        if (this.props.onCompare) {
          return this.props.onCompare(value, index);
        }
        if (typeof element === "object") {
          return this.getInnerText(element as React.ReactElement).toLowerCase() === value.toString().toLowerCase();
        }
        return element?.toString().toLowerCase() === value.toString().toLowerCase();
      });
    }

    this.setState(next_state);
    this.props.onChange(value);
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent) => {
    if (!this.props.children) return;

    switch (event.code as EventCode) {
      case EventCode.ARROW_UP:
        this.moveCursor(Direction.UP);
        break;
      case EventCode.ARROW_DOWN:
        this.moveCursor(Direction.DOWN);
        break;
      case EventCode.ENTER:
      case EventCode.TAB:
        return this.select();
      case EventCode.ESCAPE:
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
  required?: boolean
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
