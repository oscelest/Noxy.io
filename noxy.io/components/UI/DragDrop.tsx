import React from "react";
import {v4} from "uuid";
import Dialog from "../Application/Dialog";
import Style from "./DragDrop.module.scss";

export default class DragDrop<C extends typeof React.Component, I extends InstanceType<C>> extends React.Component<DragDropProps<C, I>, State> {

  constructor(props: DragDropProps<C, I>) {
    super(props);
    this.state = {
      id:           v4(),
      flag_overlay: 0,
    };
  }

  private dragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onDragOver?.(event);
  };

  private dragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (this.state.flag_overlay === 0) {
      this.setState({dialog: Dialog.show(this.props.message, {title: this.props.title, dismiss: false, listener: this.state.id})});
    }
    this.setState({flag_overlay: this.state.flag_overlay + 1});
    this.props.onDragEnter?.(event);
  };

  private dragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const next_state = {} as State;
    next_state.flag_overlay = this.state.flag_overlay - 1;
    if (!next_state.flag_overlay) {
      Dialog.close(this.state.dialog);
      next_state.dialog = undefined;
    }
    this.props.onDragLeave?.(event);
    this.setState(next_state);
  };

  private drop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    Dialog.close(this.state.dialog);
    this.setState({flag_overlay: 0, dialog: undefined});
    this.props.onDrop?.(event);
  };

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")} onDragOver={this.dragOver} onDragEnter={this.dragEnter} onDragLeave={this.dragLeave} onDrop={this.drop}>
        {this.props.children}
        <Dialog listener={this.state.id}/>
      </div>
    );
  }
}

export interface DragDropProps<C extends typeof React.Component, I extends InstanceType<C>> {
  className?: string

  title: string
  message: string
  // listener: DialogListenerType

  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void
}

interface State {
  id: string
  dialog?: string
  flag_overlay: number
}
