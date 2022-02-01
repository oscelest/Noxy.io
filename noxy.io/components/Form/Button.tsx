import React from "react";
import EventCode from "../../../common/enums/EventCode";
import Size from "../../../common/enums/Size";
import Util from "../../../common/services/Util";
import IconType from "../../enums/IconType";
import Helper from "../../Helper";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import Loader from "../UI/Loader";
import Style from "./Button.module.scss";
import Icon from "./Icon";

export default class Button<V> extends Component<EventProps | ValueProps<V>, State> {

  constructor(props: EventProps | ValueProps<V>) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }

  public focus() {
    this.state.ref.current?.focus();
  }

  public render() {
    const {ref} = this.state;
    const {className, icon, children, loading = false, disabled = false} = this.props;

    const tab_index = !this.props.disabled ? 0 : undefined;

    const classes = [Style.Component];
    if (!children) classes.push(Style.Simple);
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(" ")} tabIndex={tab_index} data-disabled={disabled} data-loading={loading}
           onClick={this.eventClick} onMouseEnter={this.eventMouseEnter} onMouseLeave={this.eventMouseLeave} onMouseDown={this.eventMouseDown} onMouseUp={this.eventMouseUp}
           onFocus={this.eventFocus} onBlur={this.eventBlur} onKeyDown={this.eventKeyDown}>
        <Loader className={Style.Loader} size={Size.SMALL} value={loading}>
          <Conditional condition={icon}>
            <Icon className={Style.Icon} type={icon!}/>
          </Conditional>
          <Conditional condition={children}>
            {children}
          </Conditional>
        </Loader>
      </div>
    );
  }

  private readonly eventMouseDown = (event: React.MouseEvent) => {
    this.invokeEvent(event, this.props.onMouseDown);
  };

  private readonly eventMouseUp = (event: React.MouseEvent) => {
    this.invokeEvent(event, this.props.onMouseUp);
  };

  private readonly eventMouseEnter = (event: React.MouseEvent) => {
    this.invokeEvent(event, this.props.onMouseEnter);
  };

  private readonly eventMouseLeave = (event: React.MouseEvent) => {
    this.invokeEvent(event, this.props.onMouseLeave);
  };

  private readonly eventFocus = (event: React.FocusEvent) => {
    this.invokeEvent(event, this.props.onFocus);
  };

  private readonly eventBlur = (event: React.FocusEvent) => {
    this.invokeEvent(event, this.props.onBlur);
  };

  private readonly eventClick = (event: React.MouseEvent<HTMLDivElement>) => {
    this.invokeEvent(event, this.props.onClick);
  };

  private readonly invokeEvent = (event: React.SyntheticEvent, callback?: (...args: any[]) => any | Promise<any>) => {
    if (this.props.disabled || this.props.loading) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    Util.hasProperty(this.props, "value") ? callback?.(this.props.value, event) : callback?.(event);
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const element = Helper.getActiveElement() as HTMLDivElement;

    if (event.target === element) {

      if (event.code === EventCode.ESCAPE) {
        event.preventDefault();
        event.stopPropagation();
        element.blur();
      }
      else if (event.code === EventCode.SPACE || event.code === EventCode.ENTER) {
        element.click();
      }
    }
  };

}

interface BaseProps {
  icon?: IconType;
  loading?: boolean;
  disabled?: boolean;
  className?: string;

  onClick?(...args: any[]): any | Promise<any>;
  onMouseEnter?(...args: any[]): any | Promise<any>;
  onMouseLeave?(...args: any[]): any | Promise<any>;
  onFocus?(...args: any[]): any | Promise<any>;
  onBlur?(...args: any[]): any | Promise<any>;
}

interface EventProps extends BaseProps {
  value?: never;
  onClick?(event: React.MouseEvent): any | Promise<any>;
  onMouseDown?(event: React.MouseEvent): any | Promise<any>;
  onMouseUp?(event: React.MouseEvent): any | Promise<any>;
  onMouseEnter?(event: React.MouseEvent): any | Promise<any>;
  onMouseLeave?(event: React.MouseEvent): any | Promise<any>;
  onFocus?(event: React.MouseEvent): any | Promise<any>;
  onBlur?(event: React.MouseEvent): any | Promise<any>;
}

interface ValueProps<V> extends BaseProps {
  value: V;
  onClick?(value: V, event: React.MouseEvent): any | Promise<any>;
  onMouseDown?(value: V, event: React.MouseEvent): any | Promise<any>;
  onMouseUp?(value: V, event: React.MouseEvent): any | Promise<any>;
  onMouseEnter?(value: V, event: React.MouseEvent): any | Promise<any>;
  onMouseLeave?(value: V, event: React.MouseEvent): any | Promise<any>;
  onFocus?(value: V, event: React.MouseEvent): any | Promise<any>;
  onBlur?(value: V, event: React.MouseEvent): any | Promise<any>;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
}
