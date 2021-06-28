import React from "react";
import EventKey from "../../enums/EventKey";
import IconType from "../../enums/IconType";
import Size from "../../enums/Size";
import Helper from "../../Helper";
import Icon from "./Icon";
import Loader from "../UI/Loader";
import Style from "./Button.module.scss";
import Conditional from "../Application/Conditional";
import Component from "../Application/Component";

export default class Button<V> extends Component<EventProps | ValueProps<V>, State> {

  constructor(props: EventProps | ValueProps<V>) {
    super(props);
    this.state = {};
  }

  public render() {
    const tab_index = !this.props.disabled ? 0 : undefined;
    const disabled = this.props.disabled ?? false;
    const loading = this.props.loading ?? false;
    const classes = [Style.Component];
    if (!this.props.children) classes.push(Style.Simple);
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")} tabIndex={tab_index} data-disabled={disabled} data-loading={loading}
           onClick={this.eventClick} onMouseEnter={this.eventMouseEnter} onMouseLeave={this.eventMouseLeave} onFocus={this.eventFocus} onBlur={this.eventBlur} onKeyDown={this.eventKeyDown}>
        <Loader className={Style.Loader} size={Size.SMALL} show={loading}>
          <Conditional condition={this.props.icon}>
            <Icon className={Style.Icon} type={this.props.icon!}/>
          </Conditional>
          <Conditional condition={this.props.children}>
            {this.props.children}
          </Conditional>
        </Loader>
      </div>
    );
  }

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

    Helper.hasProperty(this.props, "value") ? callback?.(this.props.value, event) : callback?.(event);
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const element = Helper.getActiveElement() as HTMLDivElement;

    if (event.target === element) {

      if (event.key === EventKey.ESCAPE) {
        event.preventDefault();
        event.stopPropagation();
        element.blur();
      }
      else if (event.key === EventKey.SPACE || event.key === EventKey.ENTER) {
        element.click();
      }
    }
  };

}

interface BaseProps {
  icon?: IconType
  loading?: boolean
  disabled?: boolean
  className?: string

  onClick?(...args: any[]): any | Promise<any>
  onMouseEnter?(...args: any[]): any | Promise<any>
  onMouseLeave?(...args: any[]): any | Promise<any>
  onFocus?(...args: any[]): any | Promise<any>
  onBlur?(...args: any[]): any | Promise<any>
}

interface EventProps extends BaseProps {
  value?: never
  onClick?(event: React.MouseEvent): any | Promise<any>
  onMouseEnter?(event: React.MouseEvent): any | Promise<any>
  onMouseLeave?(event: React.MouseEvent): any | Promise<any>
  onFocus?(event: React.MouseEvent): any | Promise<any>
  onBlur?(event: React.MouseEvent): any | Promise<any>
}

interface ValueProps<V> extends BaseProps {
  value: V
  onClick?(value: V, event: React.MouseEvent): any | Promise<any>
  onMouseEnter?(value: V, event: React.MouseEvent): any | Promise<any>
  onMouseLeave?(value: V, event: React.MouseEvent): any | Promise<any>
  onFocus?(value: V, event: React.MouseEvent): any | Promise<any>
  onBlur?(value: V, event: React.MouseEvent): any | Promise<any>
}

interface State {

}
