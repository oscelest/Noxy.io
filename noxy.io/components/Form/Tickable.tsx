import _ from "lodash";
import React from "react";
import EventKey from "../../enums/EventKey";
import Util from "../../Util";
import Style from "./Tickable.module.scss";

export default class Tickable<V, C extends TickableCollection<V>> extends React.Component<TickableProps<V, C>, State> {

  constructor(props: TickableProps<V, C>) {
    super(props);
  }

  public static createElement<V>(value: V, text?: string, checked?: boolean, disabled?: boolean): TickableItem<V> {
    return {value, text, checked, disabled}
  }

  public change = (key: keyof C) => {
    const collection = this.getData();
    if (collection[key].disabled) return;

      if (this.props.radio) {
      this.props.onChange(_.mapValues(collection, (item, text) => ({...item, checked: text === key})));
    }
    else {
      this.props.onChange({...collection, [key]: {...collection[key], checked: !collection[key].checked}});
    }
  };

  private readonly getData = () => {
    return this.props.children as C;
  }

  public render = () => {
    const classes = [Style.Component, this.props.radio ? Style.Radio : Style.Checkbox];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {_.map(this.props.children, this.renderItem)}
      </div>
    );
  };

  private readonly renderItem = (tickable: TickableItem<V>, key: string) => {
    const tab_index = !tickable.disabled ? 0 : undefined;
    const checked = tickable.checked ?? false;
    const disabled = tickable.disabled ?? false;

    return (
      <div key={key} className={Style.Item} tabIndex={tab_index} data-checked={checked} data-disabled={disabled} onClick={this.eventTickableClick} onKeyDown={this.eventTickableKeyDown}>
        <div className={Style.Box}/>
        {this.renderText(tickable.text)}
      </div>
    );
  };

  private readonly renderText = (text?: string) => {
    if (!text) return null;

    return (
      <div className={Style.Text}>{text}</div>
    );
  }

  private readonly eventTickableClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    this.change(Util.getChildKey(event.currentTarget, this.props.children));
  };

  private readonly eventTickableKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case EventKey.ENTER:
      case EventKey.SPACE:
        event.preventDefault();
        event.stopPropagation();
        return this.change(Util.getChildKey(event.currentTarget, this.props.children));
    }
  };

}

export interface TickableCollection<V> {
  [key: string]: TickableItem<V>
}

export interface TickableItem<V> {
  value: V

  text?: string
  checked?: boolean
  disabled?: boolean
}

interface TickableProps<V, C extends TickableCollection<V>> {
  radio?: boolean

  className?: string
  children: TickableCollection<V>

  onChange(value: TickableCollection<V>): void | Promise<void>
}

interface State {

}
