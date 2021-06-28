import _ from "lodash";
import React from "react";
import Button from "../../components/Form/Button";
import Style from "./Switch.module.scss";
import Component from "../Application/Component";

export default class Switch<V extends {}> extends Component<SwitchProps<V>, State> {

  constructor(props: SwitchProps<V>) {
    super(props);

    this.state = {};
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {_.map(this.props.children, this.renderOption)}
      </div>
    );
  }

  private readonly renderOption = (value: V[keyof V], key: string) => {
    const state = value === this.props.value;

    return (
      <div key={key} className={Style.Option} data-active={state}>
        <Button className={Style.Button} value={value} onClick={this.eventClick}>{key}</Button>
      </div>
    );
  };

  private readonly eventClick = (value: V[keyof V]) => {
    this.props.onChange(value);
  };
}

export interface SwitchProps<V extends {}> {
  value: V[keyof V]

  children?: V
  className?: string

  onChange: (value: V[keyof V]) => void
}

interface State {

}
