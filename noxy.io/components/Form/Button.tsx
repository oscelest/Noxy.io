import _ from "lodash";
import React from "react";
import ButtonType from "../../enums/ButtonType";
import EventKey from "../../enums/EventKey";
import IconType from "../../enums/IconType";
import Size from "../../enums/Size";
import Util from "../../Util";
import Icon from "../Base/Icon";
import Loader from "../UI/Loader";
import Style from "./Button.module.scss";

export default class Button<V> extends React.Component<EventProps | ValueProps<V>, State> {

  constructor(props: EventProps | ValueProps<V>) {
    super(props);
    this.state = {};
  }

  public render() {
    const {} = this.state;
    const {className, loading} = this.props;

    const tab_index = !this.props.disabled ? 0 : undefined;
    const disabled = this.props.disabled ?? false;
    const classes = [Style.Component];
    if (!this.props.children) classes.push(Style.Simple);
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")} tabIndex={tab_index} data-disabled={disabled}
           onClick={this.eventClick} onMouseEnter={this.eventMouseEnter} onMouseLeave={this.eventMouseLeave} onFocus={this.eventFocus} onBlur={this.eventBlur} onKeyDown={this.eventKeyDown}>
        <Loader size={Size.SMALL} show={loading}>
          {this.renderIcon()}
          {this.renderChildren()}
        </Loader>
      </div>
    );
  }

  private readonly renderIcon = () => {
    if (!this.props.icon) return null;

    return (
      <Icon className={Style.Icon} type={this.props.icon}/>
    );
  };

  private readonly renderChildren = () => {
    if (!this.props.children) return null;

    return Array.isArray(this.props.children) ? _.map(this.props.children, this.renderChild) : this.renderChild(this.props.children);
  };

  private readonly renderChild = (child: React.PropsWithChildren<BaseProps>["children"], index: number = 0) => {
    if (typeof child === "object") return {...child, key: index};

    return (
      <span key={index}>{child}</span>
    );
  };

  private readonly eventMouseEnter = (event: React.MouseEvent) => this.invokeEvent(event, this.props.onMouseEnter);
  private readonly eventMouseLeave = (event: React.MouseEvent) => this.invokeEvent(event, this.props.onMouseLeave);
  private readonly eventFocus = (event: React.FocusEvent) => this.invokeEvent(event, this.props.onFocus);
  private readonly eventBlur = (event: React.FocusEvent) => this.invokeEvent(event, this.props.onBlur);
  private readonly eventClick = (event: React.MouseEvent<HTMLDivElement>) => this.invokeEvent(event, this.props.onClick);

  private readonly invokeEvent = (event: React.SyntheticEvent, callback?: (...args: any[]) => any | Promise<any>) => {
    if (!callback) return;
    if (this.props.disabled || this.props.loading) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    this.props.value !== undefined ? callback(this.props.value, event) : callback(event);
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const element = Util.getActiveElement() as HTMLDivElement;

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
  type?: ButtonType
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
