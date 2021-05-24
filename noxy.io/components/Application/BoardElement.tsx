import _ from "lodash";
import React from "react";
import Icon from "../Form/Icon";
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
import BoardContentEditForm from "../../forms/board/BoardContentEditForm";
import ConfirmForm from "../../forms/ConfirmForm";

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

    try {
      if (this.props.entity.exists()) {
        next_state.board_category_list = await BoardCategoryEntity.findManyByBoard(this.props.entity.id);
        this.props.entity.board_category_list.sort((a, b) => a.weight > b.weight ? 1 : -1);

        for (let category of next_state.board_category_list) {
          category.board = this.props.entity;
          category.board_lane_list.sort((a, b) => a.weight > b.weight ? 1 : -1);

          for (let lane of category.board_lane_list) {
            lane.board_category = category;
            lane.content = this.props.onLaneTransform?.(lane) ?? lane.content;

            lane.board_card_list.sort((a, b) => a.weight > b.weight ? 1 : -1);

            for (let card of lane.board_card_list) {
              card.board_lane = lane;
              card.content = this.props.onCardTransform?.(card) ?? card.content;
            }
          }
        }
      }
    }
    catch (error) {
      next_state.board_category_list = [];
    }
    next_state.board_category_current = next_state.board_category_list[0] ?? new BoardCategoryEntity();

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
              {/*<Button>Hello World</Button>*/}
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
        <div className={Style.LaneContent}>
          {this.props.onLaneRender ? this.props.onLaneRender(lane) : Helper.renderJSON(lane.content)}
        </div>
        <div className={Style.ActionList}>
          <Icon className={Style.ActionDelete} type={IconType.CLOSE} value={lane} onClick={this.eventContentDelete}/>
          <div className={Style.ActionDrag} onMouseDown={this.eventDragMouseDown}/>
          <Icon className={Style.ActionEdit} type={IconType.EDIT} value={lane} onClick={this.eventContentEdit}/>
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
            {this.props.onCardRender ? this.props.onCardRender(card) : Helper.renderJSON(card.content)}
          </div>
        </Conditional>
        <div className={Style.ActionList}>
          <Icon className={Style.ActionDelete} type={IconType.CLOSE} value={card} onClick={this.eventContentDelete}/>
          <div className={Style.ActionDrag}/>
          <Icon className={Style.ActionEdit} type={IconType.EDIT} value={card} onClick={this.eventContentEdit}/>
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

    next_state.drag_start_entity = card_element ? lane_entity : lane_entity.board_category;
    next_state.drag_start_index = card_element ? this.getCardIndex(next_state.drag_entity as BoardCardEntity) : this.getLaneIndex(next_state.drag_entity as BoardLaneEntity);

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

        const drag_origin = new Point(target_rect.x + drag_offset.x, target_rect.y + drag_offset.y);
        this.setState({drag_point, drag_origin, drag_end_index: target_lane_index, drag_end_entity: target_lane_entity.board_category});
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

        const drag_origin = new Point(target_rect.x + drag_offset.x, target_rect.y + drag_offset.y);
        this.setState({drag_point, drag_origin, drag_end_index: target_card_index, drag_end_entity: target_lane_entity});
      }
    }

    this.setState({drag_point});
  };

  private readonly eventDragMouseUp = () => {
    const {drag_entity, drag_start_entity, drag_start_index, drag_end_index, drag_end_entity} = this.state;
    this.setState({drag_entity: undefined, drag_point: undefined, drag_origin: undefined, drag_offset: undefined});
    window.removeEventListener("mousemove", this.eventDragMouseMove);
    window.removeEventListener("mouseup", this.eventDragMouseUp);
    if (drag_start_index !== undefined && drag_start_entity && drag_end_index !== undefined && drag_end_entity) {
      if (drag_start_entity.getPrimaryKey() === drag_end_entity.getPrimaryKey() && drag_start_index === drag_end_index) return;

      if (drag_entity instanceof BoardCardEntity && drag_end_entity instanceof BoardLaneEntity) {
        return BoardCardEntity.moveOne({board_card: drag_entity, board_lane: drag_end_entity, weight: drag_end_index});
      }

      if (drag_entity instanceof BoardLaneEntity && drag_end_entity instanceof BoardCategoryEntity) {
        return BoardLaneEntity.moveOne({board_lane: drag_entity, board_category: drag_end_entity, weight: drag_end_index});
      }
    }
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

  private readonly eventLaneCreate = async (category: BoardCategoryEntity) => {
    this.setState({loading_add_lane: true});
    const entity = await this.props.onLaneCreate?.(category) ?? await BoardLaneEntity.createOne({board_category: category});
    entity.board_category = category;
    category.board_lane_list.push(entity);
    this.setState({loading_add_lane: false});
  };

  private readonly eventCardCreate = async (lane: BoardLaneEntity) => {
    this.setState({loading_add_card: lane});
    const entity = await this.props.onCardCreate?.(lane) ?? await BoardCardEntity.createOne({board_lane: lane});
    entity.board_lane = lane;
    lane.board_card_list.push(entity);
    this.setState({loading_add_card: undefined});
  };

  private readonly eventContentEdit = (entity: BoardCardEntity | BoardLaneEntity) => {
    if (entity instanceof BoardCardEntity && this.props.onCardEdit) return this.props.onCardEdit(entity);
    if (entity instanceof BoardLaneEntity && this.props.onLaneEdit) return this.props.onLaneEdit(entity);

    this.setState({dialog: Dialog.show(<BoardContentEditForm entity={entity} onSubmit={this.eventContentEditSubmit}/>)});
  };

  private readonly eventContentEditSubmit = <V extends BoardCardEntity | BoardLaneEntity>(new_entity: V, old_entity: V) => {
    old_entity.content = new_entity.content;
    this.setState({dialog: Dialog.close(this.state.dialog)});
  };

  private readonly eventContentDelete = (entity: BoardCardEntity | BoardLaneEntity) => {
    if (entity instanceof BoardLaneEntity && this.props.onLaneEdit) return this.props.onLaneEdit(entity);
    if (entity instanceof BoardCardEntity && this.props.onCardEdit) return this.props.onCardEdit(entity);

    this.setState({dialog: Dialog.show(<ConfirmForm value={entity} onAccept={this.eventContentDeleteSubmit}/>, {title: `Permanently delete "${entity.content}"?`})});
  };

  private readonly eventContentDeleteSubmit = async <V extends BoardCardEntity | BoardLaneEntity>(entity: V) => {
    if (entity instanceof BoardLaneEntity) {
      await BoardLaneEntity.deleteOne(entity.id);
      _.remove(entity.board_category.board_lane_list, value => value.getPrimaryKey() === entity.getPrimaryKey());
    }
    else if (entity instanceof BoardCardEntity) {
      await BoardCardEntity.deleteOne(entity.id);
      _.remove(entity.board_lane.board_card_list, value => value.getPrimaryKey() === entity.getPrimaryKey());
    }

    this.setState({dialog: Dialog.close(this.state.dialog)});
  };

  private readonly eventBlockMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

}

export interface BoardElementProps {
  entity: BoardEntity
  className?: string

  onCardEdit?(card: BoardCardEntity): void | Promise<void>
  onCardRender?(card: BoardCardEntity): React.ReactNode
  onCardCreate?(lane: BoardLaneEntity): BoardCardEntity | Promise<BoardCardEntity>
  onCardTransform?(card: BoardCardEntity): any | Promise<any>

  onLaneEdit?(card: BoardLaneEntity): void | Promise<void>
  onLaneRender?(lane: BoardLaneEntity): React.ReactNode
  onLaneCreate?(category: BoardCategoryEntity): BoardLaneEntity | Promise<BoardLaneEntity>
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
  drag_start_index?: number
  drag_start_entity?: BoardLaneEntity | BoardCategoryEntity;
  drag_end_index?: number
  drag_end_entity?: BoardLaneEntity | BoardCategoryEntity;

  board_category_list: BoardCategoryEntity[]
  board_category_current: BoardCategoryEntity
}
