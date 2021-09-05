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
      ref:       React.createRef(),
      ref_index: React.createRef(),
      active:    false,
      collapsed: true,
    };
  }
  
  public setValue(value: string, collapse: boolean = false) {
    const index = this.getValueIndex(value);
    this.setState({collapsed: collapse, value, index});
    if (this.state.value !== value) this.props.onInputChange?.(value);
  }
  
  public setIndex(index: number, collapse: boolean = false) {
    const value = this.props.onRender?.(index) ?? this.getValueList()[index] ?? "";
    this.setState({collapsed: collapse, value, index});
    if (this.state.index !== index) this.props.onIndexChange?.(index);
  }
  
  public commit(index: number = this.state.index ?? -1, value: string = this.state.value ?? "") {
    if ((index === undefined || index === -1) && !value) {
      this.props.onReset?.();
    }
    else {
      this.props.onChange?.(index, value);
    }
    this.setState({active: false, collapsed: true, index: undefined, value: undefined});
  }
  
  private getValueList() {
    return this.state.ref_index.current?.getValueList() ?? [] as string[];
  }
  
  private getList() {
    return React.Children.toArray(this.props.children);
  }
  
  private getIndex() {
    return this.state.index ?? this.props.index ?? -1;
  }
  
  private getValue() {
    return this.state.value ?? this.props.onRender?.(this.getIndex()) ?? this.props.value ?? "";
  }
  
  private getValueIndex(value: string) {
    if (this.props.onCompare) {
      for (let i = 0; i < this.getList().length; i++) {
        if (this.props.onCompare(value, i)) return i;
      }
    }
    else {
      value = value.toLowerCase();
      if (this.props.onRender) {
        for (let i = 0; i < this.getList().length; i++) {
          if (this.props.onRender(i).toLowerCase() === value) return i;
        }
      }
      else {
        const list = this.getValueList();
        for (let i = 0; i < list.length; i++) {
          if (list[i].toLowerCase() === value) return i;
        }
      }
    }
    
    return -1;
  }
  
  private moveIndex(value: number) {
    const index = this.getIndex();
    const list = React.Children.toArray(this.props.children);
    
    if (value > 0) return this.setIndex(index === -1 ? 0 : (value + index) % list.length);
    if (value < 0) return this.setIndex(index === -1 ? list.length - 1 : (list.length + (index + value) % list.length) % list.length);
    return this.setIndex(index);
  }
  
  public render() {
    const index = this.getIndex();
    const value = this.getValue();
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <label className={classes.join(" ")}>
        <Input className={Style.Input} value={value} autoComplete={this.props.autoComplete} label={this.props.label} type={this.props.type}
               onChange={this.eventInputChange} onBlur={this.eventInputBlur} onClick={this.eventInputClick} onKeyDown={this.eventInputKeyDown}/>
        <div className={Style.Arrow} onMouseDown={this.eventArrowMouseDown} onClick={this.eventArrowClick}>
          <Icon type={IconType.CARET_DOWN}/>
        </div>
        <Dropdown className={Style.Dropdown} collapsed={this.state.collapsed}>
          <Index ref={this.state.ref_index} className={Style.Select} index={index} loading={this.props.loading} placeholder={this.props.placeholder}
                 onChange={this.eventIndexChange} onCommit={this.eventIndexCommit} onMouseEnter={this.eventIndexMouseEnter} onMouseLeave={this.eventIndexMouseLeave}>
            {this.props.children}
          </Index>
        </Dropdown>
      </label>
    );
  }
  
  private readonly eventArrowMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  private readonly eventArrowClick = () => {
    const collapsed = !this.state.collapsed;
    this.setState({collapsed});
    this.props.onDropdown?.(collapsed);
  };
  
  private readonly eventInputChange = (value: string) => {
    this.setValue(value);
  };
  
  private readonly eventIndexChange = (index: number) => {
    this.setIndex(index);
  };
  
  private readonly eventIndexCommit = () => {
    this.commit();
  };
  
  private readonly eventInputBlur = () => {
    this.commit();
  };
  
  private readonly eventInputClick = () => {
    this.setState({collapsed: false});
  };
  
  private readonly eventInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    this.handleKeyDown(event);
    
    if (event.bubbles) return true;
    event.stopPropagation();
    event.preventDefault();
    return false;
  };
  
  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.bubbles = false;
    
    switch (event.code as EventCode) {
      case EventCode.ENTER:
      case EventCode.NUMPAD_ENTER:
        if (!this.state.collapsed && this.state.index !== undefined && this.state.index > -1) this.commit();
        return this.setState({collapsed: !this.state.collapsed});
      case EventCode.TAB:
        event.bubbles = true;
        return this.commit();
      case EventCode.ESCAPE:
        this.setState({collapsed: true, value: undefined, index: undefined});
        return this.props.onReset?.();
      case EventCode.ARROW_DOWN:
        return this.moveIndex(1);
      case EventCode.ARROW_UP:
        return this.moveIndex(-1);
    }
    
    event.bubbles = true;
  };
  
  private readonly eventIndexMouseEnter = () => {
    this.setState({active: true});
  };
  
  private readonly eventIndexMouseLeave = () => {
    if (!this.state.active) return;
    this.setState({active: false, index: -1, value: ""});
  };
}

export interface AutoCompleteProps {
  className?: string;
  children?: (React.ReactElement | string)[];
  
  index: number;
  value: string;
  label: string;
  
  type?: InputType;
  error?: Error;
  loading?: string | boolean;
  required?: boolean;
  placeholder?: string | boolean;
  autoComplete?: string;
  
  onReset?(): void;
  onChange?(index: number, value: string): void;
  
  onRender?(index: number): string;
  onCompare?(value: string, index: number): boolean;
  onDropdown?(collapsed: boolean): void;
  
  onInputChange?(value: string): void;
  onIndexChange?(index: number): void;
}

interface State {
  ref: React.RefObject<HTMLInputElement>;
  ref_index: React.RefObject<Index>;
  value?: string;
  index?: number;
  active: boolean;
  collapsed: boolean;
}
