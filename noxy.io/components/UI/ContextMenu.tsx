import _ from "lodash";
import React from "react";
import Point from "../../../common/classes/Point";
import Rect from "../../../common/classes/Rect";
import IconType from "../../enums/IconType";
import FatalException from "../../exceptions/FatalException";
import Helper from "../../Helper";
import Icon from "../Form/Icon";
import Style from "./ContextMenu.module.scss";
import Component from "../Application/Component";

export default class ContextMenu extends Component<ContextMenuProps, State> {

  constructor(props: ContextMenuProps) {
    super(props);
    this.state = {
      ref:    React.createRef(),
      rect:   new Rect(0, 0, 0, 0),
      point:  new Point(0, 0),
      parent: new Rect(0, 0),
    };
  }

  public componentDidMount(): void {
    if (!this.state.ref.current || !this.state.ref.current.parentElement) throw new FatalException("Fuck");

    const next_state = {} as State;
    next_state.rect = Rect.fromDOMRect(this.state.ref.current?.getBoundingClientRect());
    next_state.parent = Rect.fromDOMRect(this.state.ref.current.parentElement.getBoundingClientRect());

    if (this.props.origin) {
      next_state.point = this.getNextPoint(new Point(this.props.origin.x, this.props.origin.y), Rect.fromDOMRect(this.state.ref.current.getBoundingClientRect()));
    }

    this.setState(next_state);
  }

  public componentDidUpdate(prevProps: Readonly<ContextMenuProps>): void {
    const next_state = {} as State;
    const element = this.state.ref.current;
    const parent_element = element?.parentElement;

    if (element && parent_element) {
      const parent_rect = Rect.fromDOMRect(parent_element.getBoundingClientRect());
      const current_rect = Rect.fromDOMRect(element.getBoundingClientRect());
      const origin_point = new Point(this.props.origin?.x ?? 0, this.props.origin?.y ?? 0);

      if (!current_rect.isEqualDimension(this.state.rect)) {
        next_state.rect = current_rect;
      }

      if (!origin_point.isEqual(new Point(prevProps.origin?.x ?? 0, prevProps.origin?.y ?? 0))) {
        next_state.point = this.getNextPoint(origin_point, current_rect);
      }

      if (!this.state.parent.isEqual(parent_rect)) {
        next_state.parent = parent_rect;

        const container = this.props.container ?? parent_element;
        const {x, y} = container.getBoundingClientRect();
        next_state.point = new Point(
          parent_rect.x + parent_rect.width + current_rect.width > x + container.clientWidth ? -current_rect.width : parent_rect.width,
          parent_rect.y + parent_rect.height + current_rect.height > y + container.clientHeight ? -current_rect.height + parent_rect.height + element.clientTop : -element.clientTop,
        );
      }
    }

    if (_.size(next_state)) this.setState(next_state);
  }

  private getNextPoint({x,y}: Point, rect: Rect) {
    const container = this.props.container ?? this.state.ref.current?.parentElement;
    if (!container) throw new FatalException("Could not get Context Menu container.");

    const view_point = new Point(_.clamp(x - container.scrollLeft, 0, container.clientWidth), _.clamp(y - container.scrollTop, 0, container.clientHeight));
    if (view_point.x + rect.width > container.clientWidth) {
      x = Math.max(x - rect.width, 0);
    }
    if (view_point.y + rect.height > container.clientHeight) {
      y = Math.max(y - rect.height, 0);
    }
    return new Point(x,y);
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    const {x: left, y: top} = this.state.point;
    const style = {left, top} as React.CSSProperties;
    if (!this.props.show) style.visibility = "hidden";

    return (
      <div ref={this.state.ref} className={classes.join(" ")} style={style} onMouseDown={this.eventMouseDown} onMouseUp={this.eventMouseUp}>
        {_.map(this.props.children, this.renderChildren)}
      </div>
    );
  }

  private readonly renderChildren = (item: ContextMenuItem, key: string) => {
    return (
      <div className={Style.Item} key={key} onClick={this.eventClick} onMouseEnter={this.eventMouseEnter} onMouseLeave={this.eventMouseLeave}>
        {this.renderItemIcon(item.icon)}
        <span className={Style.Text}>{item.text}</span>
        {this.renderItemList(key, item.items)}
      </div>
    );
  };

  private readonly renderItemIcon = (icon?: IconType) => {
    if (!icon) return null;

    return (
      <Icon className={Style.Icon} type={icon}/>
    );
  };

  private readonly renderItemList = (key: string, collection?: ContextMenuCollection) => {
    if (!collection) return null;
    const container = this.props.container ?? this.state.ref.current?.parentElement;

    return [
      <Icon key={"dropdown"} type={IconType.CARET_RIGHT}/>,
      <ContextMenu key={"menu"} show={this.state.key === key} container={container}>{collection}</ContextMenu>,
    ];
  };

  private readonly eventMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    this.setState({key: Helper.getChildKey(event.currentTarget, this.props.children) as string});
  };

  private readonly eventMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    this.setState({key: undefined});
  };

  private readonly eventMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  private readonly eventMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  private readonly eventClick = (event: React.MouseEvent<HTMLDivElement>) => {
    this.props.onCommit?.();
    Helper.getReactChildObject(event.currentTarget, this.props.children as ContextMenuCollection)?.action?.();
  };

  private readonly parseChildren = (collection: ContextMenuCollection, key: string): any => {
    return _.reduce(collection, (result, item, sub_key) => {
      const next_key = `${key}.${sub_key}`;
      return item.items ? {...result, ...this.parseChildren(item.items, next_key)} : result;
    }, {[key]: collection} as any);
  };

}

export interface ContextMenuCollection {
  [key: string]: ContextMenuItem;
}

export interface ContextMenuItem {
  text: string;
  icon?: IconType;
  action?: (...args: any[]) => any;
  items?: ContextMenuCollection;
}

export interface ContextMenuProps {
  className?: string;
  origin?: Point;
  show?: boolean;
  children: {[key: string]: ContextMenuItem};
  container?: HTMLElement | null;

  onCommit?(): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
  key?: string;
  rect: Rect;
  point: Point;
  parent: Rect;
}
