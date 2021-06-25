import React from "react";
import IconType from "../../enums/IconType";
import Style from "./Icon.module.scss";
import Helper from "../../Helper";
import Component from "../Application/Component";

export default class Icon<V = any> extends Component<IconProps<V>, State> {

  constructor(props: IconProps) {
    super(props);
  }

  public render() {
    const {className, type} = this.props;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")} onClick={this.eventClick}>{type}</div>
    );
  }

  private readonly eventClick = (event: React.MouseEvent<HTMLDivElement>) => {
    this.invokeEvent(event, this.props.onClick);
  };

  private readonly invokeEvent = (event: React.SyntheticEvent, callback?: (...args: any[]) => any | Promise<any>) => {
    return Helper.hasProperty(this.props, "value") ? callback?.(this.props.value, event) : callback?.(event);
  };
}

export type IconProps<V = any> = EventProps | ValueProps<V>

interface State {

}


interface BaseProps {
  type: IconType
  className?: string

  onClick?(...args: any[]): any | Promise<any>
  onMouseDown?(...args: any[]): any | Promise<any>
  onMouseUp?(...args: any[]): any | Promise<any>
}

interface EventProps extends BaseProps {
  value?: never
  onClick?(event: React.MouseEvent): any | Promise<any>
  onMouseDown?(event: React.MouseEvent): any | Promise<any>
  onMouseUp?(event: React.MouseEvent): any | Promise<any>
}

interface ValueProps<V> extends BaseProps {
  value: V
  onClick?(value: V, event: React.MouseEvent): any | Promise<any>
  onMouseDown?(value: V, event: React.MouseEvent): any | Promise<any>
  onMouseUp?(value: V, event: React.MouseEvent): any | Promise<any>
}
