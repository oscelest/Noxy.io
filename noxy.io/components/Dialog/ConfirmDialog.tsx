import React from "react";
import Dialog from "../Application/Dialog";
import Button from "../Form/Button";
import Style from "./ConfirmDialog.module.scss";
import DialogContainer from "./DialogContainer";
import DialogOverlay from "./DialogOverlay";

export default class ConfirmDialog<V> extends React.Component<ConfirmDialogProps<V>, State> {

  constructor(props: ConfirmDialogProps<V>) {
    super(props);
  }

  public readonly close = () => {
    this.props.onClose?.();
    Dialog.close(this);
  };

  public render() {
    const title = this.props.title ?? "Perform action?";
    const close = this.props.close !== false ? this.close : undefined;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <DialogOverlay onClose={close}>
        <DialogContainer className={classes.join(" ")} title={title} onClose={close}>
          <div className={Style.ActionList}>
            <Button className={Style.Action} onClick={this.eventDecline}>{this.props.decline ?? "Cancel"}</Button>
            <Button className={Style.Action} onClick={this.eventAccept}>{this.props.accept ?? "Confirm"}</Button>
          </div>
        </DialogContainer>
      </DialogOverlay>
    );
  }

  private readonly eventAccept = async () => {
    if (this.props.onAccept) {
      const result = await this.props.onAccept?.(this.props.value as V);
      if (result === false) return;
    }
    Dialog.close(this);
  };

  private readonly eventDecline = async () => {
    if (this.props.onDecline) {
      const result = await this.props.onDecline?.(this.props.value as V);
      if (result === false) return;
    }
    Dialog.close(this);
  };
}

export interface ConfirmDialogProps<V> {
  title?: string
  close?: boolean
  value?: V
  accept?: string
  decline?: string

  className?: string
  children?: never
  onClose?(): void
  onAccept?(value: V): boolean | void | Promise<boolean | void>
  onDecline?(value: V): boolean | void | Promise<boolean | void>
}

interface State {

}
