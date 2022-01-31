import _ from "lodash";
import React from "react";
import Button from "../../components/Form/Button";
import Style from "./Switch.module.scss";
import Component from "../Application/Component";
import IconType from "../../enums/IconType";

export default class Switch<V extends {}> extends Component<SwitchProps<V>, State> {

  constructor(props: SwitchProps<V>) {
    super(props);
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {_.map(this.props.list, this.renderOption)}
      </div>
    );
  }

  private readonly renderOption = (option: SwitchItem<V>, index: number = 0) => {
    const classes = [Style.Option];
    if (option.value === this.props.value) classes.push(Style.Active);

    return (
      <Button key={index} className={classes.join(" ")} icon={option.icon} value={option.value} disabled={this.props.disabled} onClick={this.eventClick}>{option.text}</Button>
    );
  };

  private readonly eventClick = (value: V) => {
    this.props.onChange(value);
  };
}

export interface SwitchProps<V extends {}> {
  list: SwitchCollection<V>;
  value: V;

  children?: never;
  className?: string;
  disabled?: boolean;

  onChange: (value: V) => void;
}

export type SwitchCollection<V> = SwitchItem<V>[];

interface SwitchItem<V> {
  value: V;
  text?: string;
  icon?: IconType;
}

interface State {

}
