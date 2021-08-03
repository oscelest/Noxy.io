import React from "react";
import Button from "../components/Form/Button";
import Style from "./ConfirmForm.module.scss";
import Component from "../components/Application/Component";

export default class ConfirmForm<V> extends Component<ConfirmFormProps<V>, State> {

  constructor(props: ConfirmFormProps<V>) {
    super(props);
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <Button className={Style.Action} value={this.props.value} onClick={this.props.onDecline}>{this.props.decline ?? "Cancel"}</Button>
        <Button className={Style.Action} value={this.props.value} onClick={this.props.onAccept}>{this.props.accept ?? "Confirm"}</Button>
      </div>
    );
  }
}

export interface ConfirmFormProps<V> {
  close?: boolean
  value: V
  accept?: string
  decline?: string

  className?: string
  children?: never

  onAccept?(value: V): boolean | void | Promise<boolean | void>
  onDecline?(value: V): boolean | void | Promise<boolean | void>
}

interface State {

}
