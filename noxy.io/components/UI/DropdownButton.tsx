import React from "react";
import Component from "../Application/Component";
import Style from "./DropdownButton.module.scss";
import Button from "../Form/Button";
import IconType from "../../enums/IconType";
import Dropdown from "../Base/Dropdown";
import Helper from "../../Helper";
import KeyboardCommand from "../../enums/KeyboardCommand";

export default class DropdownButton extends Component<DropdownButtonProps, State> {

  constructor(props: DropdownButtonProps) {
    super(props);
    this.state = {
      ref:       React.createRef(),
      collapsed: true,
    };
  }

  public componentWillUnmount(): void {
    window.removeEventListener("mouseup", this.eventMouseUp);
    window.removeEventListener("mousedown", this.eventMouseDown);
  }

  public open() {
    this.setState({collapsed: false});
    this.props.onOpen?.();
  }

  public close() {
    this.setState({collapsed: true});
    this.props.onClose?.();
  }

  public dismiss() {
    this.setState({collapsed: true});
    this.props.onDismiss?.();
  }

  public render() {
    const {className, disabled, icon, text} = this.props;
    const {ref, collapsed} = this.state;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(" ")} onKeyDown={this.eventKeyDown}>
        <Button icon={icon} value={!collapsed} onClick={this.eventBackgroundColorDropdown} disabled={disabled}>{text}</Button>
        <Dropdown className={Style.Dropdown} collapsed={collapsed}>
          {this.props.children}
        </Dropdown>
      </div>
    );
  }

  private readonly eventBackgroundColorDropdown = (collapsed: boolean) => {
    this.setState({collapsed});

    if (!collapsed) {
      this.props.onOpen?.();
      window.addEventListener("mousedown", this.eventMouseDown);
    }
    else {
      this.props.onClose?.();
      window.removeEventListener("mouseup", this.eventMouseUp);
      window.removeEventListener("mousedown", this.eventMouseDown);
    }
  };

  private readonly eventMouseDown = (event: MouseEvent) => {
    if (!this.state.ref.current || !event.composedPath().includes(this.state.ref.current)) {
      window.addEventListener("mouseup", this.eventMouseUp);
    }
  };

  private readonly eventMouseUp = (event: MouseEvent) => {
    if (!this.state.ref.current || !event.composedPath().includes(this.state.ref.current)) {
      this.props.onClose?.();
      this.setState({collapsed: true});
      window.removeEventListener("mouseup", this.eventMouseUp);
      window.removeEventListener("mousedown", this.eventMouseDown);
    }
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    this.props.onKeyDown?.(event);

    if (!event.defaultPrevented && event.bubbles) {
      this.handleKeyDown(event);
    }

    if (!event.bubbles) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  };

  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const command = Helper.getKeyboardEventCommand(event);
    event.bubbles = false;

    switch (command) {
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return this.close();
      case KeyboardCommand.CANCEL:
        return this.dismiss();
    }

    event.bubbles = true;
  };
}

export interface DropdownButtonProps {
  className?: string;
  disabled?: boolean;
  icon?: IconType;
  text?: string;

  onOpen?(): void;
  onClose?(): void;
  onDismiss?(): void;
  onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
  collapsed: boolean;
}
