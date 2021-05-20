import _ from "lodash";
import React from "react";
import Icon from "../Base/Icon";
import Button from "../Form/Button";
import Dialog from "./Dialog";
import Helper from "../../Helper";
import Loader from "../UI/Loader";
import Conditional from "./Conditional";
import Placeholder from "../UI/Placeholder";
import BoardCategoryCreateForm from "../../forms/board/BoardCategoryCreateForm";
import Rect from "../../classes/Rect";
import Point from "../../classes/Point";
import IconType from "../../enums/IconType";
import FatalException from "../../exceptions/FatalException";
import BoardEntity from "../../entities/board/BoardEntity";
import BoardCardEntity from "../../entities/board/BoardCardEntity";
import BoardLaneEntity from "../../entities/board/BoardLaneEntity";
import BoardCategoryEntity from "../../entities/board/BoardCategoryEntity";
import Style from "./BoardElement.module.scss";

export default class BoardElement extends React.Component<BoardElementProps, State> {

  constructor(props: BoardElementProps) {
    super(props);
    this.state = {
      ref:      React.createRef(),
      ref_drag: React.createRef(),

      loading:          true,
      loading_add_lane: false,

      board_category_list:    [],
      board_category_current: new BoardCategoryEntity(),
    };
  }

  private readonly getBoardCategoryList = async () => {
    try {
      return await BoardCategoryEntity.findManyByBoard(this.props.entity.id);
    }
    catch (error) {
      return [];
    }
  };

  private readonly getLaneElement = (target: Element) => {
    const element = target.closest(`.${Style.Lane}`);
    if (!element) throw new FatalException("Lane element could not be found.");
    return element;
  };

  private readonly getCardElement = (element: Element) => {
    return element.closest(`.${Style.Card}`);
  };

  private readonly getLaneElementList = () => {
    if (!this.state.ref.current) return [];
    return this.state.ref.current.querySelectorAll(`.${Style.Lane}`);
  };

  private readonly getCardElementList = () => {
    if (!this.state.ref.current) return [];
    return this.state.ref.current.querySelectorAll(`.${Style.Card}, .${Style.CardAdd}`);
  };

  private readonly getLaneEntity = (target: Element) => {
    const element = target.classList.contains(Style.Lane) ? target : this.getLaneElement(target) as HTMLDivElement | null;
    if (!element) throw new FatalException("Lane element missing", "Lane element missing.");

    const entity = Helper.getReactChildObject(element, this.state.board_category_current.board_lane_list);
    if (!entity) throw new FatalException("Lane entity missing", "Lane entity missing in current category.");

    return entity;
  };

  private readonly getCardEntity = (lane: BoardLaneEntity, target: Element) => {
    const element = target.classList.contains(Style.Card) ? target : this.getCardElement(target) as HTMLDivElement | null;
    if (!element) throw new FatalException("Card element missing", "Card element missing.");

    const entity = Helper.getReactChildObject(element, lane.board_card_list);
    if (!entity) throw new FatalException("Card entity missing", "Card entity missing in lane card list.");

    return entity;
  };

  private readonly getLaneIndex = (lane: BoardLaneEntity, category: BoardCategoryEntity = lane.board_category) => {
    const index = _.findIndex(category.board_lane_list, entity => entity.getPrimaryKey() === lane.getPrimaryKey());
    if (index === -1) throw new FatalException("Could not get lane index");
    return index;
  };

  private readonly getCardIndex = (card: BoardCardEntity, lane: BoardLaneEntity = card.board_lane) => {
    const index = _.findIndex(lane.board_card_list, entity => entity.getPrimaryKey() === card.getPrimaryKey());
    if (index === -1) throw new FatalException("Could not get card index");
    return index;
  };

  private readonly getDragStyle = (current?: boolean): React.CSSProperties => {
    const {drag_origin, drag_point} = this.state;
    return current && drag_origin && drag_point ? {left: `${drag_point.x - drag_origin.x}px`, top: `${drag_point.y - drag_origin.y}px`, zIndex: 100} : {};
  };

  public async componentDidMount() {
    const next_state = {} as State;
    next_state.loading = false;

    if (this.props.entity.exists()) {
      next_state.board_category_list = await this.getBoardCategoryList();

      for (let category of next_state.board_category_list) {
        category.board = this.props.entity;

        for (let lane of category.board_lane_list) {
          lane.board_category = category;
          lane.content = this.props.onLaneTransform?.(lane) ?? lane.content;

          for (let card of lane.board_card_list) {
            card.board_lane = lane;
            card.content = this.props.onCardTransform?.(card) ?? card.content;
          }
        }
      }

      next_state.board_category_current = next_state.board_category_list[0] ?? new BoardCategoryEntity();
    }

    this.setState(next_state);
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div ref={this.state.ref} className={classes.join(" ")}>

        <Loader show={this.state.loading}>
          <Placeholder className={Style.Placeholder} show={!this.props.entity.exists()} text={"This board could not be loaded."}>

            <div className={Style.Header}>
              <Button>Hello World</Button>
            </div>

            <div className={Style.Content}>

              <div className={Style.Sidebar}>
                {_.map(this.state.board_category_list, this.renderBoardCategory)}
                <Button className={Style.Category} icon={IconType.UI_ADD} onClick={this.eventCreateCategoryClick}/>
              </div>

              <div className={Style.LaneList}>
                {_.map(this.state.board_category_current.board_lane_list, this.renderBoardLane)}
                <Button className={Style.LaneAdd} icon={IconType.UI_ADD} value={this.state.board_category_current} onClick={this.eventLaneCreate}>Add new lane</Button>
              </div>

            </div>

          </Placeholder>
        </Loader>

      </div>
    );
  }

  private readonly renderBoardCategory = (category: BoardCategoryEntity, index: number = 0) => {
    return (
      <Button key={index} className={Style.Category} icon={IconType.CLOCK} onClick={this.eventCategoryClick}/>
    );
  };

  private readonly renderBoardLane = (lane: BoardLaneEntity, index: number = 0) => {
    const is_drag_lane = this.state.drag_entity && this.state.drag_entity instanceof BoardLaneEntity && this.state.drag_entity.getPrimaryKey() === lane.getPrimaryKey();
    const ref = is_drag_lane ? this.state.ref_drag : undefined;

    return (
      <div key={index} ref={ref} className={Style.Lane} style={this.getDragStyle(is_drag_lane)}>
        <div className={Style.LaneContent}>{this.props.onLaneRender ? this.props.onLaneRender(lane) : lane.content?.toString() ?? ""}</div>
        <div className={Style.ActionList}>
          <Icon className={Style.ActionDelete} type={IconType.CLOSE}/>
          <div className={Style.ActionDrag} onMouseDown={this.eventDragMouseDown}/>
          <Icon className={Style.ActionEdit} type={IconType.EDIT}/>
        </div>
        <div className={Style.CardList}>
          {_.map(lane.board_card_list, this.renderBoardCard)}
          <Button className={Style.CardAdd} icon={IconType.UI_ADD} value={lane} onClick={this.eventCardCreate}>Add new card</Button>
        </div>
      </div>
    );
  };

  private readonly renderBoardCard = (card: BoardCardEntity, index: number = 0) => {
    const is_drag_card = this.state.drag_entity && this.state.drag_entity instanceof BoardCardEntity && this.state.drag_entity.getPrimaryKey() === card.getPrimaryKey();
    const ref = is_drag_card ? this.state.ref_drag : undefined;

    return (
      <div key={index} ref={ref} className={Style.Card} style={this.getDragStyle(is_drag_card)} data-active={is_drag_card} onMouseDown={this.eventDragMouseDown}>
        <Conditional condition={card.content}>
          <div className={Style.CardContent} onMouseDown={this.eventBlockMouseDown}>
            {this.props.onCardRender ? this.props.onCardRender(card) : card.content?.toString() ?? ""}
          </div>
        </Conditional>
        <div className={Style.ActionList}>
          <Icon className={Style.ActionDelete} type={IconType.CLOSE} value={card} onClick={this.eventCardEdit}/>
          <div className={Style.ActionDrag}/>
          <Icon className={Style.ActionEdit} type={IconType.EDIT} value={card} onClick={this.eventCardEdit}/>
        </div>
      </div>
    );
  };

  private readonly eventDragMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const next_state = {} as State;
    const lane_element = this.getLaneElement(event.currentTarget);
    const card_element = this.getCardElement(event.currentTarget);
    const lane_entity = this.getLaneEntity(lane_element);

    next_state.drag_origin = new Point(event.pageX, event.pageY);
    next_state.drag_point = next_state.drag_origin;

    const {left, top} = (card_element ?? lane_element).getBoundingClientRect();
    next_state.drag_offset = new Point(next_state.drag_origin.x - left, next_state.drag_origin.y - top);
    next_state.drag_entity = card_element ? this.getCardEntity(lane_entity, card_element) : lane_entity;

    this.setState(next_state);
    event.preventDefault();
    window.addEventListener("mousemove", this.eventDragMouseMove);
    window.addEventListener("mouseup", this.eventDragMouseUp);
  };

  private readonly eventDragMouseMove = (event: MouseEvent) => {
    const {drag_entity, drag_origin, drag_offset, ref_drag} = this.state;
    if (!drag_entity || !drag_origin || !drag_offset || !ref_drag?.current) return;

    const drag_point = new Point(event.pageX, event.pageY);

    if (drag_entity instanceof BoardLaneEntity) {
      const lane_element_list = this.getLaneElementList();
      for (let i = 0; i < lane_element_list.length; i++) {
        const target_element = lane_element_list[i];
        const target_rect = Rect.fromDOMRect(target_element.getBoundingClientRect());
        if (!target_rect.containsPoint(drag_point) || target_element === ref_drag.current) continue;

        const target_lane_entity = this.getLaneEntity(target_element);
        const drag_lane_index = this.getLaneIndex(drag_entity);
        const target_lane_index = this.getLaneIndex(target_lane_entity);

        this.state.board_category_current.board_lane_list.splice(drag_lane_index, 1);
        this.state.board_category_current.board_lane_list.splice(target_lane_index, 0, drag_entity);

        return this.setState({drag_point, drag_origin: new Point(target_rect.x + drag_offset.x, target_rect.y + drag_offset.y)});
      }
    }
    else {
      const card_element_list = this.getCardElementList();
      for (let i = 0; i < card_element_list.length; i++) {
        const target_element = card_element_list[i];
        const target_rect = Rect.fromDOMRect(target_element.getBoundingClientRect());
        const is_card = target_element.classList.contains(Style.Card);
        if (!target_rect.containsPoint(drag_point) || (is_card && target_element === ref_drag.current) || (!is_card && target_element.previousElementSibling === ref_drag.current)) continue;

        const target_lane_entity = this.getLaneEntity(target_element);
        const drag_card_index = this.getCardIndex(drag_entity);
        const target_card_index = is_card ? this.getCardIndex(this.getCardEntity(target_lane_entity, target_element)) : target_lane_entity.board_card_list.length;

        drag_entity.board_lane.board_card_list.splice(drag_card_index, 1);
        target_lane_entity.board_card_list.splice(target_card_index, 0, drag_entity);
        drag_entity.board_lane = target_lane_entity;

        return this.setState({drag_point, drag_origin: new Point(target_rect.x + drag_offset.x, target_rect.y + drag_offset.y)});
      }
    }

    this.setState({drag_point});
  };

  private readonly eventDragMouseUp = () => {
    this.setState({drag_entity: undefined, drag_point: undefined, drag_origin: undefined, drag_offset: undefined});
    window.removeEventListener("mousemove", this.eventDragMouseMove);
    window.removeEventListener("mouseup", this.eventDragMouseUp);
  };

  private readonly eventCategoryClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const board_category_current = Helper.getReactChildObject(event.currentTarget, this.state.board_category_list);
    if (!board_category_current) throw new FatalException("Could not change category", "The chosen category could not be loaded properly. Please reload the page and try again.");
    this.setState({board_category_current});
  };

  private readonly eventCreateCategoryClick = () => {
    this.setState({
      dialog: Dialog.show(
        <BoardCategoryCreateForm board={this.props.entity} onSubmit={this.eventCreateCategorySubmit}/>,
        {title: "Create new Category"},
      ),
    });
  };

  private readonly eventCreateCategorySubmit = (entity: BoardCategoryEntity) => {
    Dialog.close(this.state.dialog);
    this.setState({dialog: undefined, board_category_list: [...this.state.board_category_list, entity], board_category_current: entity});
  };

  private readonly eventLaneCreate = async (board_category_current: BoardCategoryEntity) => {
    this.setState({loading_add_lane: true});
    board_category_current.board_lane_list.push(await BoardLaneEntity.createOne({content: "New lane", board_category: board_category_current}));
    this.setState({loading_add_lane: false});
  };

  private readonly eventCardCreate = async (lane: BoardLaneEntity) => {
    this.setState({loading_add_card: lane});
    lane.board_card_list.push(await BoardCardEntity.createOne({content: `"New card"`, board_lane: lane}));
    this.setState({loading_add_card: undefined});
  };

  private readonly eventCardEdit = (card: BoardCardEntity) => {
    this.props.onCardEdit(card);
  };

  private readonly eventBlockMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

}

export interface BoardElementProps {
  entity: BoardEntity
  className?: string

  onCardEdit(card: BoardCardEntity): void | Promise<void>
  onCardRender?(card: BoardCardEntity): React.ReactNode
  onCardTransform?(card: BoardCardEntity): any | Promise<any>

  onLaneEdit(card: BoardLaneEntity): void | Promise<void>
  onLaneRender?(lane: BoardLaneEntity): React.ReactNode
  onLaneTransform?(card: BoardLaneEntity): any | Promise<any>
}

interface State {
  ref: React.RefObject<HTMLDivElement>
  ref_drag: React.RefObject<HTMLDivElement>

  dialog?: string

  loading: boolean
  loading_add_lane: boolean
  loading_add_card?: BoardLaneEntity;

  drag_point?: Point
  drag_origin?: Point
  drag_offset?: Point
  drag_entity?: BoardLaneEntity | BoardCardEntity;

  board_category_list: BoardCategoryEntity[]
  board_category_current: BoardCategoryEntity
}
