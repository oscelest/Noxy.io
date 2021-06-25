import _ from "lodash";
import React from "react";
import EventKey from "../../enums/EventKey";
import Helper from "../../Helper";
import Style from "./RadioButton.module.scss";
import Conditional from "../Application/Conditional";
import Component from "../Application/Component";

export default class RadioButton<V, C extends RadioButtonCollection<string, V>> extends Component<RadioButtonProps<V, C>, State> {

  constructor(props: RadioButtonProps<V, C>) {
    super(props);
  }

  public static createElement<V>(value: V, text?: string, checked?: boolean, disabled?: boolean): RadioButtonItem<V> {
    return {value, text, checked, disabled};
  }

  public change = (key: keyof C) => {
    const collection = this.getData();
    if (collection[key].disabled) return;
    this.props.onChange(_.mapValues(collection, (item, index) => ({...item, checked: index === key})));
  };

  private readonly getData = () => {
    return this.props.children as C;
  };

  public render() {
    const classes = [Style.Component, Style.Checkbox];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {_.map(this.getData(), this.renderItem)}
      </div>
    );
  };

  private readonly renderItem = (tickable: RadioButtonItem<V>, key: string) => {
    const tab_index = !tickable.disabled ? 0 : undefined;
    const checked = tickable.checked ?? false;
    const disabled = tickable.disabled ?? false;

    return (
      <div key={key} className={Style.Item} tabIndex={tab_index} data-checked={checked} data-disabled={disabled} onClick={this.eventClick} onKeyDown={this.eventKeyDown}>
        <div className={Style.Box}/>
        <Conditional condition={tickable.text}>
          <span className={Style.Text}>{tickable.text}</span>
        </Conditional>
      </div>
    );
  };

  private readonly eventClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    this.change(Helper.getChildKey(event.currentTarget, this.getData()));
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case EventKey.ENTER:
      case EventKey.SPACE:
        event.preventDefault();
        event.stopPropagation();
        return this.change(Helper.getChildKey(event.currentTarget, this.getData()));
    }
  };

}

export type RadioButtonCollection<K extends string, V = K> = {
  [Key in K]: RadioButtonItem<V>
}

export interface RadioButtonItem<V> {
  value: V
  text?: string
  checked?: boolean
  disabled?: boolean
}

interface RadioButtonProps<V, C extends RadioButtonCollection<string, V>> {
  className?: string
  children?: RadioButtonCollection<string, V>

  onChange(value: RadioButtonCollection<string, V>): void | Promise<void>
}

interface State {

}
