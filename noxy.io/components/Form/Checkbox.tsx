import _ from "lodash";
import React from "react";
import EventKey from "../../enums/EventKey";
import Helper from "../../Helper";
import Conditional from "../Application/Conditional";
import Style from "./Checkbox.module.scss";

export default class Checkbox<V, O extends {[key: string]: V}, C extends CheckboxCollection<O>> extends React.Component<CheckboxProps<V, O, C>, State> {

  constructor(props: CheckboxProps<V, O, C>) {
    super(props);
  }

  public static createElement<V>(value: V, text?: string, checked?: boolean, disabled?: boolean): CheckboxItem<V> {
    return {value, text, checked, disabled};
  }

  public change = (key: keyof C) => {
    const collection = this.getData();
    if (collection[key].disabled) return;
    this.props.onChange({...collection, [key]: {...collection[key], checked: !collection[key].checked}});
  };

  private readonly getData = () => {
    return this.props.children as C;
  };

  public render = () => {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {_.map(this.getData(), this.renderItem)}
      </div>
    );
  };

  private readonly renderItem = (item: CheckboxItem<V>, key: string) => {
    const tab_index = !item.disabled ? 0 : undefined;
    const checked = item.checked ?? false;
    const disabled = item.disabled ?? false;

    return (
      <div key={key} className={Style.Item} tabIndex={tab_index} data-checked={checked} data-disabled={disabled} onClick={this.eventTickableClick} onKeyDown={this.eventTickableKeyDown}>
        <div className={Style.Box}/>
        <Conditional condition={item.text}>
          <span className={Style.Text}>{item.text}</span>
        </Conditional>
      </div>
    );
  };

  private readonly eventTickableClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    this.change(Helper.getChildKey(event.currentTarget, this.getData()));
  };

  private readonly eventTickableKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case EventKey.ENTER:
      case EventKey.SPACE:
        event.preventDefault();
        event.stopPropagation();
        return this.change(Helper.getChildKey(event.currentTarget, this.getData()));
    }
  };

}

export type CheckboxCollection<V extends {[key: string]: any}> = {
  [K in keyof V]: CheckboxItem<V[K]>
}

export interface CheckboxItem<V> {
  value: V
  text?: string
  checked?: boolean
  disabled?: boolean
}

interface CheckboxProps<V, O extends {[key: string]: V}, C extends CheckboxCollection<O>> {
  className?: string
  children: CheckboxCollection<O>

  onChange(value: CheckboxCollection<O>): void | Promise<void>
}

interface State {

}
