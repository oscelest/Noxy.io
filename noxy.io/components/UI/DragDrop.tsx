import React from "react";
import Dialog, {DialogListenerType, DialogPriority} from "../Application/Dialog";
import ElementDialog from "../Dialog/ElementDialog";
import Style from "./DragDrop.module.scss";

export default class DragDrop<C extends typeof React.Component, I extends InstanceType<C>> extends React.Component<DragDropProps<C, I>, State> {

  constructor(props: DragDropProps<C, I>) {
    super(props);
    this.state = {
      ref_dialog:   React.createRef(),
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
      Dialog.show(
        this.props.listener,
        DialogPriority.FIRST,
        <ElementDialog ref={this.state.ref_dialog} title={this.props.title} close={false}>{this.props.message}</ElementDialog>,
      );
    }
    this.setState({flag_overlay: this.state.flag_overlay + 1});
    this.props.onDragEnter?.(event);
  };

  private dragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    this.state.flag_overlay === 1 && this.state.ref_dialog.current && Dialog.close(this.state.ref_dialog.current);
    this.setState({flag_overlay: this.state.flag_overlay - 1});
    this.props.onDragLeave?.(event);
  };

  private drop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    this.state.ref_dialog.current && Dialog.close(this.state.ref_dialog.current);
    this.setState({flag_overlay: 0});
    this.props.onDrop?.(event.dataTransfer.files, event);
  };

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")} onDragOver={this.dragOver} onDragEnter={this.dragEnter} onDragLeave={this.dragLeave} onDrop={this.drop}>
        {this.props.children}
        <Dialog listener={this.props.listener}/>
      </div>
    );
  }
}

export interface DragDropProps<C extends typeof React.Component, I extends InstanceType<C>> {
  className?: string

  title: string
  message: string
  listener: DialogListenerType

  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (files: FileList, event: React.DragEvent<HTMLDivElement>) => void
}

interface State {
  ref_dialog: React.RefObject<ElementDialog>
  flag_overlay: number
}
