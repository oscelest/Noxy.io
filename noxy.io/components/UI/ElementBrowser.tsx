import _ from "lodash";
import React from "react";
import Point from "../../classes/Point";
import Rect from "../../classes/Rect";
import Direction from "../../enums/Direction";
import EventKey from "../../enums/EventKey";
import FatalException from "../../exceptions/FatalException";
import Util from "../../Util";
import ContextMenu, {ContextMenuCollection} from "./ContextMenu";
import Style from "./ElementBrowser.module.scss";

export default class ElementBrowser extends React.Component<ElementBrowserProps, State> {

  private static scrollCoefficient = 4;

  constructor(props: ElementBrowserProps) {
    super(props);
    this.state = {
      focus:             -1,
      ref_container:     React.createRef(),
      ref_context_menu:  React.createRef(),
      ref_drag_select:   React.createRef(),
      flag_ctrl:         false,
      flag_shift:        false,
      flag_context_menu: false,
    };
  }

  //region    -- Drag select methods --

  private readonly startSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const next_state = {} as State;

    this.getContainer().focus({preventScroll: true});
    next_state.flag_shift = event.shiftKey;
    next_state.flag_ctrl = event.ctrlKey;
    next_state.point_target = next_state.point_origin = this.getMouseEventPoint(event).confine(this.getContainerViewRect());
    next_state.point_cursor = new Point(event.pageX, event.pageY);

    next_state.selection_prev = this.getEmptySelection();

    if (next_state.flag_shift) {
      next_state.selection_prev[this.getFocus()] = true;
    }
    if (next_state.flag_ctrl) {
      next_state.selection_prev = _.assign(next_state.selection_prev, this.props.selection);
    }
    if (_.some(next_state.selection_prev)) {
      next_state.selection_next = [...next_state.selection_prev];
    }

    next_state.interval = window.setInterval(() => {
      const {interval, point_cursor, point_target, point_origin, selection_rect} = this.state;
      if (!interval || !point_cursor || !point_target || !point_origin || !selection_rect) return;

      const container_outer_rect = this.getContainerOuterRect();
      if (container_outer_rect.containsPoint(point_cursor)) return;

      const container_inner_rect = this.getContainerInnerRect();
      const next_state = {} as State;
      const {x, y} = container_outer_rect.getPointOffset(point_cursor);

      next_state.point_target = point_target.translate(Math.round(x / ElementBrowser.scrollCoefficient), Math.round(y / ElementBrowser.scrollCoefficient)).confine(container_inner_rect);
      next_state.selection_rect = Rect.fromPoints(point_origin, next_state.point_target);

      this.getContainer().scrollBy(next_state.point_target.x - point_target.x, next_state.point_target.y - point_target.y);
      this.setState(next_state);
    }, 20);

    this.setState(next_state);
    window.addEventListener("mousemove", this.moveSelection);
    window.addEventListener("mouseup", this.endSelection);
  };


  private readonly moveSelection = (event: MouseEvent) => {
    const {point_origin, selection_rect} = this.state;
    if (!point_origin) return this.removeSelectionListener();

    const next_state = {} as State;
    next_state.flag_context_menu = false;
    next_state.point_cursor = new Point(event.pageX, event.pageY);
    next_state.point_target = this.getMouseEventPoint(event).confine(this.getContainerViewRect());

    if (selection_rect || Point.getDistanceBetweenPoints(point_origin, next_state.point_target) > 10) {
      next_state.selection_next = [];
      next_state.selection_rect = Rect.fromPoints(point_origin, next_state.point_target);
      next_state.selection_next.push(...this.getCurrentSelection(next_state.selection_rect));
    }

    this.setState(next_state);
  };


  private readonly endSelection = () => {
    const {point_origin, point_target, selection_rect} = this.state;
    if (!point_origin || !point_target) return;

    const next_state = {} as State;
    const selected = [];

    if (selection_rect) {
      selected.push(...this.getCurrentSelection(selection_rect));
    }
    else {
      const element_rect_list = _.map(this.getChildren(), (element, index) => this.getElementRect(index));
      const selection_rect = Rect.fromPoints(point_origin, point_target);
      selected.push(...this.getCurrentSelection(selection_rect, element_rect_list));
      next_state.focus = _.findIndex(element_rect_list, rect => selection_rect.overlapsRect(rect));
    }

    next_state.flag_context_menu = false;
    next_state.interval = undefined;
    next_state.point_origin = undefined;
    next_state.point_target = undefined;
    next_state.point_cursor = undefined;
    next_state.selection_rect = undefined;
    next_state.selection_prev = undefined;
    next_state.selection_next = undefined;

    this.setState(next_state);
    this.props.onSelect(selected);
  };

  private readonly getCurrentSelection = (selection_rect: Rect, rect_list = _.map(this.getChildren(), (element, index) => this.getElementRect(index))) => {
    const {flag_ctrl, flag_shift, selection_prev = []} = this.state;
    const selected = [];
    const rect = flag_shift ? Rect.union(selection_rect, ..._.filter(rect_list, (rect, index) => selection_prev[index])) : selection_rect;

    for (let index = 0; index < rect_list.length; index++) {
      if (!rect_list.hasOwnProperty(index)) continue;
      if (rect.overlapsRect(rect_list[index])) {
        selected.push(!(flag_ctrl && selection_prev[index]));
      }
      else {
        selected.push(flag_ctrl && selection_prev[index]);
      }
    }

    return selected;
  };

  private readonly removeSelectionListener = () => {
    window.removeEventListener("mousemove", this.moveSelection);
    window.removeEventListener("mouseup", this.endSelection);
  };

  //endregion -- Drag select methods --

  //region    -- Cursor select methods --

  public readonly moveCursor = (direction: MoveDirection, accumulate: boolean = false, extend: boolean = false) => {
    const next_state = {focus: this.getFocus()};
    let distance = !accumulate && extend ? -Infinity : Infinity;

    const element_list = this.getChildren();
    const rect = this.getElementRect(next_state.focus);
    const center = rect.getCenter();
    const selected = accumulate ? this.props.selection : Array(element_list.length).fill(false);

    if (extend && accumulate) {
      const focus_rect = this.getFocusRect(direction, rect);
      const capture_rect = this.getCaptureRect(direction, _.reduce(selected, (result, selected, index) => selected ? Rect.union(result, this.getElementRect(index)) : result, rect));

      for (let index = 0; index < element_list.length; index++) {
        if (!element_list.hasOwnProperty(index)) continue;
        if (index === next_state.focus) continue;

        const target_rect = this.getElementRect(index);
        if (capture_rect.overlapsRect(target_rect)) {
          selected[index] = true;

          const target_distance = Point.getDistanceBetweenPoints(target_rect.getCenter(), center);
          if (focus_rect.overlapsRect(target_rect) && target_distance < distance) {
            next_state.focus = index;
            distance = target_distance;
          }
        }
      }
    }
    else {
      const capture_rect = this.getCaptureRect(direction, rect);
      if (!extend) delete element_list[next_state.focus];

      for (let index = 0; index < element_list.length; index++) {
        if (!element_list.hasOwnProperty(index)) continue;

        const target_rect = this.getElementRect(index);
        if (!capture_rect.overlapsRect(target_rect)) continue;

        const target_distance = Point.getDistanceBetweenPoints(target_rect.getCenter(), center);
        if (extend) {
          selected[index] = true;
          if (target_distance < distance) continue;
        }
        else if (target_distance > distance) continue;

        next_state.focus = index;
        distance = target_distance;
      }

      selected[next_state.focus] = true;
    }

    this.getElement(next_state.focus).scrollIntoView({inline: "nearest", block: "nearest"});
    this.setState(next_state);
    this.props.onSelect(selected);
  };

  private readonly getCaptureRect = (direction: MoveDirection, rect: Rect) => {
    switch (direction) {
      case Direction.LEFT:
        return new Rect(0, rect.y, rect.x + rect.width, rect.height);
      case Direction.UP:
        return new Rect(rect.x, 0, rect.width, rect.y + rect.height);
      case Direction.RIGHT:
        return new Rect(rect.x, rect.y, this.getContainerInnerRect().width - rect.x, rect.height);
      case Direction.DOWN:
        return new Rect(rect.x, rect.y, rect.width, this.getContainerInnerRect().height - rect.y);
    }
  };

  private readonly getFocusRect = (direction: MoveDirection, rect: Rect) => {
    const container_rect = this.getContainerInnerRect();
    switch (direction) {
      case Direction.LEFT:
        return new Rect(0, 0, rect.width, container_rect.height);
      case Direction.UP:
        return new Rect(0, 0, container_rect.width, rect.height);
      case Direction.RIGHT:
        return new Rect(container_rect.width - rect.width, 0, rect.width - rect.x, container_rect.height);
      case Direction.DOWN:
        return new Rect(0, container_rect.height - rect.height, container_rect.width, rect.height);
    }
  };

  //endregion -- Cursor select methods --

  //region    -- Utility methods --

  private readonly getFocus = () => {
    return this.state.focus === -1 ? 0 : this.state.focus;
  };

  private readonly getChildren = () => {
    return React.Children.toArray(this.props.children);
  };

  private readonly getEmptySelection = () => {
    return Array(this.getChildren().length).fill(false);
  };

  private readonly getMouseEventPoint = ({pageX, pageY}: React.MouseEvent | MouseEvent) => {
    const {scrollLeft, scrollTop} = this.getContainer();
    const {x, y} = this.getContainerOuterRect();
    return new Point(pageX - x + scrollLeft, pageY - y + scrollTop);
  };

  private readonly getContainer = () => {
    if (!this.state.ref_container.current) {
      throw new FatalException(
        "Unexpected error occurred while selecting elements",
        "This error should only appear if your browser window has been manipulated.\nIf you continue seeing this message, please reload the window.",
      );
    }

    return this.state.ref_container.current;
  };

  private readonly getContainerViewRect = () => {
    const {scrollLeft, scrollTop} = this.getContainer();
    const {width, height} = this.getContainerOuterRect();
    return new Rect(scrollLeft, scrollTop, width, height);
  };

  private readonly getContainerInnerRect = () => {
    const {scrollWidth, scrollHeight} = this.getContainer();
    return new Rect(0, 0, scrollWidth, scrollHeight);
  };

  private readonly getContainerOuterRect = () => {
    return Rect.fromDOMRect(this.getContainer().getBoundingClientRect());
  };

  private readonly getElement = (index: number) => {
    const container = this.getContainer();
    if (!container.children[index]) throw new Error();
    return container.children[index];
  };

  private readonly getElementRect = (index: number) => {
    const container = this.getContainer();
    const {scrollLeft, scrollTop} = container;
    const {left, top} = container.getBoundingClientRect();
    return Rect.fromDOMRect(this.getElement(index).getBoundingClientRect()).translate(scrollLeft - left, scrollTop - top);
  };

  //endregion -- Utility methods --

  //region    -- Render methods --

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div ref={this.state.ref_container} className={classes.join(" ")} tabIndex={0} onFocus={this.eventContainerFocus} onBlur={this.eventContainerBlur}
           onMouseDown={this.startSelection} onKeyDown={this.eventContainerKeyDown} onContextMenu={this.eventContainerContextMenu}>
        {_.map(this.getChildren(), this.renderItem)}
        {this.renderDragSelect()}
        {this.renderContextMenu()}
      </div>
    );
  }

  private readonly renderItem = (child: React.ReactElement, index: number = 0) => {
    const active = this.state.ref_container.current === Util.getActiveElement();
    const selected = active && (!this.state.selection_next && this.props.selection[index] || this.state.selection_next?.[index]) ? "" : undefined;
    const focused = active && index === this.state.focus ? "" : undefined;

    const classes = [Style.Element];
    if (child.props.className) classes.push(child.props.className);

    return {...child, key: index, props: {...child.props, className: classes.join(" "), "data-selected": selected, "data-focused": focused}};
  };

  private readonly renderDragSelect = () => {
    if (!this.state.selection_rect) return null;

    return (
      <div className={Style.DragSelect} style={this.state.selection_rect.toCSS()}/>
    );
  };

  private readonly renderContextMenu = () => {
    if (!this.state.context_menu) return null;

    return (
      <ContextMenu origin={this.state.point_context_menu} show={this.state.flag_context_menu} onCommit={this.eventContextMenuCommit}>{this.state.context_menu}</ContextMenu>
    );
  };

  //endregion -- Render methods --

  //region    -- Event handlers --

  private readonly eventContainerFocus = () => this.setState({});
  private readonly eventContainerBlur = () => {
    window.clearInterval(this.state.interval);
    this.removeSelectionListener();
    this.props.onSelect(Array(this.props.selection.length).fill(false));
    this.setState({
      focus:              -1,
      interval:           undefined,
      flag_ctrl:          false,
      flag_shift:         false,
      flag_context_menu:  false,
      context_menu:       undefined,
      point_context_menu: undefined,
      point_target:       undefined,
      point_origin:       undefined,
      point_cursor:       undefined,
      selection_rect:     undefined,
      selection_prev:     undefined,
      selection_next:     undefined,
    });
  };

  private readonly eventContainerContextMenu = (event: React.MouseEvent) => {
    if (!this.props.onContextMenu) return;

    const next_state = {} as State;
    next_state.point_context_menu = this.getMouseEventPoint(event);
    next_state.flag_context_menu = true;

    const element_rect_list = _.map(this.getChildren(), (element, index) => this.getElementRect(index));
    const selection_rect = new Rect(next_state.point_context_menu.x, next_state.point_context_menu.y, 0, 0);
    const selection = this.getCurrentSelection(selection_rect, element_rect_list);

    if (_.some(this.props.selection, (selected, index) => selected && selection[index])) {
      next_state.context_menu = this.props.onContextMenu(this.props.selection);
    }
    else {
      this.props.onSelect(selection);
      next_state.focus = _.findIndex(selection);
      next_state.context_menu = this.props.onContextMenu(selection);
    }

    event.preventDefault();
    this.setState(next_state);
  };

  private readonly eventContextMenuCommit = () => {
    this.setState({flag_context_menu: false, point_context_menu: undefined, context_menu: undefined});
  };

  private readonly eventContainerKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key as EventKey) {
      case EventKey.ARROW_UP:
        this.moveCursor(Direction.UP, event.ctrlKey, event.shiftKey);
        break;
      case EventKey.ARROW_DOWN:
        this.moveCursor(Direction.DOWN, event.ctrlKey, event.shiftKey);
        break;
      case EventKey.ARROW_LEFT:
        this.moveCursor(Direction.LEFT, event.ctrlKey, event.shiftKey);
        break;
      case EventKey.ARROW_RIGHT:
        this.moveCursor(Direction.RIGHT, event.ctrlKey, event.shiftKey);
        break;
      case EventKey.DELETE:
        this.props.onDelete?.();
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  //endregion -- Event handlers --
}

type MoveDirection = Direction.UP | Direction.DOWN | Direction.LEFT | Direction.RIGHT

export interface ElementBrowserProps {
  className?: string

  children?: React.ReactNode

  selection: boolean[]
  multiSelect?: boolean

  onSelect(selected: boolean[]): void
  onDelete?(): void
  onContextMenu?(selected: boolean[]): ContextMenuCollection
}

interface State {
  ref_container: React.RefObject<HTMLDivElement>
  ref_context_menu: React.RefObject<HTMLDivElement>
  ref_drag_select: React.RefObject<HTMLDivElement>

  context_menu?: ContextMenuCollection
  flag_context_menu: boolean
  point_context_menu?: Point

  focus: number
  interval?: number

  flag_ctrl: boolean
  flag_shift: boolean
  point_cursor?: Point
  point_origin?: Point
  point_target?: Point
  selection_rect?: Rect
  selection_prev?: boolean[]
  selection_next?: boolean[]
}
