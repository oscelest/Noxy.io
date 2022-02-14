import Component from "components/Application/Component";
import InputType from "enums/InputType";
import React from "react";
import EventCode from "../../../common/enums/EventCode";
import IconType from "../../enums/IconType";
import Dropdown from "../Base/Dropdown";
import Index from "../Base/Index";
import Style from "./AutoComplete.module.scss";
import Icon from "./Icon";
import Input from "./Input";

export default class AutoComplete extends Component<AutoCompleteProps, State> {

  constructor(props: AutoCompleteProps) {
    super(props);
    this.state = {
      ref_input: React.createRef(),
      ref_index: React.createRef(),
      collapsed: true,
      reset:     false,
    };
  }

  public setValue(value: string) {
    this.props.onInputChange?.(value);
    this.setState({collapsed: false});
  }

  public setIndex(index: number) {
    this.props.onIndexChange?.(index);
    this.setState({collapsed: false});
  }

  public commit() {
    if (this.state.reset) {
      this.props.onReset?.();
    }
    else if (!this.props.strict || this.props.index > -1) {
      this.props.onChange(this.props.value, this.props.index);
    }
    else {
      this.props.onReset?.();
    }
    this.setState({collapsed: true, reset: false});
  }

  private moveIndex(offset: number) {
    const index = this.props.index;
    const length = React.Children.toArray(this.props.children).length;

    if (offset > 0) return this.setIndex(index === -1 ? 0 : (offset + index) % length);
    if (offset < 0) return this.setIndex(index === -1 ? length - 1 : (length + (index + offset) % length) % length);
    return this.setIndex(index);
  }

  public componentDidUpdate(): void {
    if (this.state.reset) {
      this.state.ref_input.current?.blur();
    }
  }

  public render() {
    const {className, label, type, autoComplete, placeholder, loading, children, value, index, disabled} = this.props;
    const {ref_input, ref_index, collapsed} = this.state;

    const classes = [Style.Component];
    if (className) classes.push(className);
    if (disabled) classes.push(Style.Disabled);

    return (
      <div className={classes.join(" ")} onMouseDown={this.eventMouseDown} onClick={this.eventClick}>
        <Input ref={ref_input} className={Style.Input} value={value} autoComplete={autoComplete} label={label} type={type} disabled={disabled}
               onChange={this.eventInputChange} onBlur={this.eventInputBlur} onFocus={this.eventInputFocus} onKeyDown={this.eventInputKeyDown}/>
        <div className={Style.Arrow}>
          <Icon type={IconType.CARET_DOWN}/>
        </div>
        <Dropdown className={Style.Dropdown} collapsed={collapsed}>
          <Index ref={ref_index} className={Style.Select} index={index} loading={loading} placeholder={placeholder} onChange={this.eventIndexChange} onCommit={this.eventIndexCommit}>
            {children}
          </Index>
        </Dropdown>
      </div>
    );
  }

  private readonly eventMouseDown = (event: React.MouseEvent<HTMLDivElement>) => event.preventDefault();
  private readonly eventClick = () => this.state.ref_input.current?.focus();

  private readonly eventInputBlur = () => this.commit();
  private readonly eventInputFocus = () => this.setState({collapsed: false});

  private readonly eventInputChange = (value: string) => this.setValue(value);
  private readonly eventIndexChange = (index: number) => this.setIndex(index);
  private readonly eventIndexCommit = () => this.commit();

  private readonly eventInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    this.handleKeyDown(event);

    if (!event.bubbles) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.bubbles = false;

    switch (event.code as EventCode) {
      case EventCode.ENTER:
      case EventCode.NUMPAD_ENTER:
        return this.commit();
      case EventCode.ESCAPE:
        return this.setState({reset: true});
      case EventCode.ARROW_DOWN:
        return this.moveIndex(1);
      case EventCode.ARROW_UP:
        return this.moveIndex(-1);
    }

    event.bubbles = true;
  };
}

export interface AutoCompleteProps {
  className?: string;
  children?: (React.ReactElement | string)[];

  index: number;
  value: string;
  label?: string;

  type?: InputType;
  error?: Error;
  strict?: boolean;

  loading?: string | boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string | boolean;
  autoComplete?: string;

  onReset?(): void;
  onChange(value: string, index: number): void;
  onCompare?(value: string, child: React.ReactChild | React.ReactFragment | React.ReactPortal, index: number): boolean;
  onInputChange?(value: string): void;
  onIndexChange?(index: number): void;
}

interface State {
  ref_input: React.RefObject<Input>;
  ref_index: React.RefObject<Index>;
  reset: boolean;
  collapsed: boolean;
}
