import Component from "../Application/Component";
import React from "react";
import Point from "../../classes/Point";
import Rect from "../../classes/Rect";
import Style from "./DragSortList.module.scss";
import FatalException from "../../exceptions/FatalException";

export default class DragSortList<T> extends Component<DragSortListProps<T>, State<T>> {

  constructor(props: DragSortListProps<T>) {
    super(props);
    this.state = {
      ref_drag: React.createRef(),
      ref_list: React.createRef(),
    };
  }

  private getDragStyle(): React.CSSProperties {
    const {drag_offset} = this.state;
    if (!drag_offset) throw new FatalException("Cannot dragged element's style with no origin and target point.");
    return {left: `${drag_offset.x}px`, top: `${drag_offset.y}px`, zIndex: 100};
  };

  private getDataIndex(element: Element): number {
    const attribute = element.getAttribute("data-index");
    if (!attribute) {
      throw new FatalException("Could not get data-index of element.");
    }

    const value = +attribute;
    if (isNaN(value) || value < 0 || value >= this.props.list.length) {
      throw new FatalException("Target PageBlock element index is invalid.");
    }

    return value;
  }

  public componentDidUpdate(prevProps: Readonly<DragSortListProps<T>>, prevState: Readonly<State<T>>) {
    if (this.state.ref_drag.current && !this.state.drag_source_rect) {
      this.setState({drag_source_rect: Rect.fromDOMRect(this.state.ref_drag.current.getBoundingClientRect())});
    }
  }

  public render() {
    const {className} = this.props;

    const classes = [Style.Component, this.props.horizontal ? Style.Horizontal : Style.Vertical];
    if (className) classes.push(className);

    return (
      <div ref={this.state.ref_list} className={classes.join(" ")}>
        {this.props.list.map(this.renderItem)}
      </div>
    );
  }

  private readonly renderItem = (element: T, index: number = 0) => {
    const key = this.props.onKey?.(element, index) ?? index;
    const drag = this.state.drag_key === key;
    const ref = drag ? this.state.ref_drag : undefined;
    const style = drag ? this.getDragStyle() : undefined;

    return (
      <div key={key} ref={ref} className={Style.Item} data-key={key} data-index={index} style={style}>
        <div className={Style.Handle} onMouseDown={this.eventDragMouseDown}/>
        <div className={Style.Element}>
          {this.props.onRender(element, index)}
        </div>
      </div>
    );
  };

  private readonly eventDragMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const next_state = {} as State<T>;
    const element = event.currentTarget;

    next_state.drag_offset = new Point(0, 0);
    next_state.drag_target = new Point(event.pageX, event.pageY);
    next_state.drag_key = element.parentElement?.getAttribute("data-key") ?? "";
    if (!next_state.drag_key) throw new FatalException("Could not get key of element being dragged.");

    this.setState(next_state);
    window.addEventListener("mousemove", this.eventDragMouseMove);
    window.addEventListener("mouseup", this.eventDragMouseUp);
    event.preventDefault();
  };

  private readonly eventDragMouseMove = (event: MouseEvent) => {
    const {drag_target, drag_offset, drag_source_rect, ref_drag: {current: source_element}, ref_list, drag_target_rect} = this.state;
    if (!drag_target || !drag_offset || !drag_source_rect || !source_element) return;

    const children = ref_list.current?.children;
    if (!children) throw new FatalException("Could not get list of PageBlock elements.");

    const next_state = {} as State<T>;
    next_state.drag_target = new Point(event.pageX, event.pageY);
    next_state.drag_offset = new Point(drag_offset.x - (drag_target.x - next_state.drag_target.x), drag_offset.y - (drag_target.y - next_state.drag_target.y));

    if (drag_target_rect?.containsPoint(next_state.drag_target) || drag_source_rect.containsPoint(next_state.drag_target)) {
      return this.setState(next_state);
    }

    next_state.drag_target_rect = undefined;
    for (let i = 0; i < children.length; i++) {
      const target_element = children.item(i);
      if (!target_element) continue;

      const target_rect = Rect.fromDOMRect(target_element.getBoundingClientRect());
      if (target_element === source_element || !target_rect.containsPoint(next_state.drag_target)) continue;

      const target_index = this.getDataIndex(target_element);
      const source_index = this.getDataIndex(source_element);

      const list = [...this.props.list];
      list.splice(source_index, 1);
      list.splice(target_index, 0, this.props.list[source_index]);
      this.props.onChange(list);

      const source_x = drag_source_rect.x > target_rect.x ? target_rect.x : target_rect.x + target_rect.width - drag_source_rect.width;
      const source_y = drag_source_rect.y > target_rect.y ? target_rect.y : target_rect.y + target_rect.height - drag_source_rect.height;

      const target_x = drag_source_rect.x < target_rect.x ? drag_source_rect.x : drag_source_rect.x + drag_source_rect.width - target_rect.width;
      const target_y = drag_source_rect.y < target_rect.y ? drag_source_rect.y : drag_source_rect.y + drag_source_rect.height - target_rect.height;

      const offset_x = drag_source_rect.x < target_rect.x ? 0 : 0;
      const offset_y = drag_source_rect.y < target_rect.y ? -(target_rect.height + target_rect.y - drag_source_rect.y - drag_source_rect.height) : drag_source_rect.y - target_rect.y;

      next_state.drag_offset = new Point(next_state.drag_offset.x + offset_x, next_state.drag_offset.y + offset_y);
      next_state.drag_source_rect = new Rect(source_x, source_y, drag_source_rect.width, drag_source_rect.height);
      next_state.drag_target_rect = new Rect(target_x, target_y, target_rect.width, target_rect.height);

      break;
    }

    this.setState(next_state);
  };

  private readonly eventDragMouseUp = () => {
    this.setState({drag_target: undefined, drag_source_rect: undefined, drag_offset: undefined, drag_key: undefined});
    window.removeEventListener("mousemove", this.eventDragMouseMove);
    window.removeEventListener("mouseup", this.eventDragMouseUp);
  };

}

export interface DragSortListProps<T> {
  className?: string;

  list: T[];
  horizontal?: boolean;

  onKey(element: T, index: number): React.Key | null | undefined;
  onRender(element: T, index: number): React.ReactElement;
  onChange(list: T[]): void;
}

interface State<T> {
  ref_list: React.RefObject<HTMLDivElement>;
  ref_drag: React.RefObject<HTMLDivElement>;

  drag_key?: React.Key;
  drag_target?: Point;
  drag_offset?: Point;
  drag_source_rect?: Rect;
  drag_target_rect?: Rect;
}
