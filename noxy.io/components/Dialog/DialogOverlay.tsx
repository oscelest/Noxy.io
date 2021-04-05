import React from "react";
import Style from "./DialogOverlay.module.scss";

export default class DialogOverlay extends React.Component<DialogOverlayProps, State> {
  
  constructor(props: DialogOverlayProps) {
    super(props);
    this.state = {
      ref:        React.createRef(),
      flag_close: false,
    };
  }

  public render() {
    return (
      <div ref={this.state.ref} className={Style.Component} onMouseDown={this.eventMouseDown} onMouseUp={this.eventMouseUp}>
        {this.props.children}
      </div>
    );
  }

  private readonly eventMouseDown = (event: React.MouseEvent) => {
    this.setState({flag_close: !!this.props.onClose && event.target === this.state.ref.current});
  };

  private readonly eventMouseUp = (event: React.MouseEvent) => {
    if (this.props.onClose && this.state.flag_close && event.target === this.state.ref.current) {
      this.props.onClose(event);
    }
    this.setState({flag_close: false});
  };
  
}

export interface DialogOverlayProps {
  onClose?(event: React.MouseEvent): void
}

interface State {
  ref: React.RefObject<HTMLDivElement>
  flag_close: boolean
}
