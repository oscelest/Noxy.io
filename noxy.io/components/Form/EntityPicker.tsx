import _ from "lodash";
import React from "react";
import IconType from "../../enums/IconType";
import FatalException from "../../exceptions/FatalException";
import Helper from "../../Helper";
import Conditional from "../Application/Conditional";
import Icon from "../Base/Icon";
import EllipsisText from "../Text/EllipsisText";
import Loader from "../UI/Loader";
import Style from "./EntityPicker.module.scss";

export default class EntityPicker<V extends {toString(): string}> extends React.Component<EntityPickerProps<V>, State> {

  constructor(props: EntityPickerProps<V>) {
    super(props);
    this.state = {};
  }

  private readonly getItemFromEvent = (event: React.MouseEvent<HTMLElement>, list: V[]) => {
    const element = event.currentTarget.parentElement;
    if (!element) throw new FatalException("Could not load file tag list", "The file tag list either hasn't been loaded properly or is unavailable at this time. Please reload the browser window.");

    const item = Helper.getReactChildObject(element, list);
    if (!item) throw new FatalException("Could not load file tag", "The file tag either no longer exists or cannot be updated at this time. Please reload the browser window.");

    return item;
  };

  private readonly getItemName = (item: V) => {
    return this.props.onRender ? this.props.onRender(item) : item.toString();
  };

  private readonly getSortedList = (list: V[]) => {
    return this.props.onSort ? list.sort(this.props.onSort) : list.sort((a, b) => this.getItemName(a).toLowerCase() > this.getItemName(b).toLowerCase() ? 1 : -1);
  };

  public render() {
    const selected = this.getSortedList(this.props.selected);
    const available = this.getSortedList(this.props.available);

    return (
      <div className={Style.Component}>
        <Conditional condition={selected.length}>
          <div className={Style.Selected}>
            {_.map(selected, this.renderSelected)}
          </div>
        </Conditional>
        <Conditional condition={available.length}>
          <Loader show={this.props.loading}>
            <div className={Style.Available}>
              {_.map(available, this.renderAvailable)}
            </div>
          </Loader>
        </Conditional>
      </div>
    );
  }

  private readonly renderSelected = (item: V, index: number = 0) => {
    return (
      <div key={index} className={Style.Item}>
        <div className={Style.Container} onClick={this.eventItemDeselect}>
          <Icon className={Style.Icon} type={IconType.UI_REMOVE}/>
          {this.renderText(item)}
        </div>
        <Conditional condition={this.props.onDelete}>
          <Icon className={Style.Delete} type={IconType.BIN} onClick={this.eventItemDeleteSelected}/>
        </Conditional>
      </div>
    );
  };

  private readonly renderAvailable = (item: V, index: number = 0) => {
    return (
      <div key={index} className={Style.Item}>
        <div className={Style.Container} onClick={this.eventItemSelect}>
          <Icon className={Style.Icon} type={IconType.UI_ADD}/>
          {this.renderText(item)}
        </div>
        <Conditional condition={this.props.onDelete}>
          <Icon className={Style.Delete} type={IconType.BIN} onClick={this.eventItemDeleteAvailable}/>
        </Conditional>
      </div>
    );
  };

  private readonly renderText = (item: V) => {
    return (
      <EllipsisText className={Style.Text}>{this.getItemName(item)}</EllipsisText>
    );
  };

  private readonly eventItemDeleteSelected = (event: React.MouseEvent<HTMLElement>) => {
    this.props.onDelete?.(this.getItemFromEvent(event, this.props.selected));
  };

  private readonly eventItemDeleteAvailable = (event: React.MouseEvent<HTMLElement>) => {
    this.props.onDelete?.(this.getItemFromEvent(event, this.props.available));
  };

  private readonly eventItemSelect = (event: React.MouseEvent<HTMLElement>) => {
    const item = this.getItemFromEvent(event, this.props.available);
    this.props.onSelect?.(item);
    this.props.onChange?.([...this.props.selected, item], _.filter(this.props.available, value => value !== item));
  };

  private readonly eventItemDeselect = (event: React.MouseEvent<HTMLElement>) => {
    const item = this.getItemFromEvent(event, this.props.selected);
    this.props.onDeselect?.(item);
    this.props.onChange?.(_.filter(this.props.selected, value => value !== item), [...this.props.available, item]);
  };
}

export interface EntityPickerProps<V> {
  loading?: boolean
  selected: V[]
  available: V[]

  onSort?(previous: V, next: V): number
  onRender?(selected: V): string
  onDelete?(selected: V): void
  onSelect?(selected: V): void
  onDeselect?(deselected: V): void
  onChange?(selected: V[], available: V[]): void
}

interface State {

}
