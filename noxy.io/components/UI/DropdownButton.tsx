import React from "react";
import Component from "../Application/Component";
import Style from "./DropdownButton.module.scss";
import Button from "../Form/Button";
import IconType from "../../enums/IconType";
import Dropdown from "../Base/Dropdown";
import Helper, {KeyboardCommandDelegate} from "../../Helper";
import KeyboardCommand from "../../enums/KeyboardCommand";

export default class DropdownButton extends Component<DropdownButtonProps, State> {

  constructor(props: DropdownButtonProps) {
    super(props);
    this.state = {
      ref:        React.createRef(),
      ref_button: React.createRef(),
      collapsed:  true,
    };
  }

  public componentWillUnmount(): void {
    window.removeEventListener("focusout", this.eventFocusOut);
  }

  public open() {
    this.props.onOpen?.();
    this.setState({collapsed: false});
    window.addEventListener("focusout", this.eventFocusOut);
  }

  public close() {
    this.props.onClose?.();
    this.setState({collapsed: true});
    window.removeEventListener("focusout", this.eventFocusOut);
  }

  public dismiss() {
    this.props.onDismiss?.();
    this.setState({collapsed: true});
    window.removeEventListener("focusout", this.eventFocusOut);
  }

  public render() {
    const {className, disabled, icon, text, children} = this.props;
    const {ref, ref_button, collapsed} = this.state;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div ref={ref} tabIndex={-1} className={classes.join(" ")} onKeyDown={this.eventKeyDown}>
        <Button ref={ref_button} icon={icon} value={!collapsed} onClick={this.eventClick} disabled={disabled}>{text}</Button>
        <Dropdown className={Style.Dropdown} collapsed={collapsed}>
          {children}
        </Dropdown>
      </div>
    );
  }

  private readonly eventFocusOut = (event: FocusEvent) => {
    if (!this.state.collapsed) {
      if (!this.state.ref.current?.contains(event.relatedTarget as Node)) {
        this.close();
      }
    }
  };

  private readonly eventClick = (collapsed: boolean, event: React.MouseEvent) => {
    if (!collapsed) {
      this.open();
    }
    else {
      this.close();
    }
    event.preventDefault();
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    this.props.onKeyDown?.(event);

    const command = Helper.getKeyboardCommandDelegate(event);
    if (!event.defaultPrevented) {
      this.handleKeyDown(command);
    }

    if (command.handled) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  };

  private readonly handleKeyDown = (event: KeyboardCommandDelegate) => {
    event.handled = true;

    switch (event.command) {
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return this.close();
      case KeyboardCommand.CANCEL:
        return this.dismiss();
    }

    event.handled = false;
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
  ref_button: React.RefObject<Button<any>>;
  collapsed: boolean;
}
