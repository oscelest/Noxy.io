import React from "react";
import Dialog from "../Application/Dialog";
import DialogContainer from "./DialogContainer";
import DialogOverlay from "./DialogOverlay";
import Style from "./ElementDialog.module.scss";

export default class ElementDialog extends React.Component<ElementDialogProps, State> {

  constructor(props: ElementDialogProps) {
    super(props);
  }

  public readonly close = () => {
    this.props.onClose?.();
    Dialog.close(this);
  };

  public render() {
    const {fullscreen, title, className} = this.props;
    const close = this.props.close !== false ? this.close : undefined;

    const classes = [Style.Component];

    if (fullscreen) classes.push(Style.Fullscreen);
    if (className) classes.push(className);

    return (
      <DialogOverlay onClose={close}>
        <DialogContainer className={classes.join(" ")} title={title} onClose={close}>
          {this.props.children}
        </DialogContainer>
      </DialogOverlay>
    );
  }
}

export interface ElementDialogProps {
  title?: string
  close?: boolean
  fullscreen?: boolean

  className?: string
  children?: React.ReactChild
  onClose?: () => void
}

interface State {

}
