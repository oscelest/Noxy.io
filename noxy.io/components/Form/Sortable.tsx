import _ from "lodash";
import React from "react";
import Order from "../../../common/enums/Order";
import IconType from "../../enums/IconType";
import Helper from "../../Helper";
import Icon from "../Base/Icon";
import Button from "./Button";
import Style from "./Sortable.module.scss";

export default class Sortable<V extends {} = {}> extends React.Component<SortableProps<V>, State<V>> {

  constructor(props: SortableProps<V>) {
    super(props);

    this.state = {};
  }

  private readonly getData = () => {
    return this.props.children as SortableCollection<V>;
  };

  private readonly getActive = () => {
    return _.find(this.getData(), item => !!item.order);
  };

  private readonly getNextOrder = (item: SortableItem) => {
    const active = this.getActive();
    if (item === active) {
      return item.order === Order.DESC ? Order.ASC : Order.DESC;
    }
    if (active) {
      return active.order;
    }
    else {
      return Order.DESC;
    }
  };

  public change = (item: SortableItem) => {
    this.props.onChange(_.mapValues(this.getData(), value => value === item ? {...value, order: this.getNextOrder(item)} : {...value, order: undefined}));
  };

  public render = () => {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <div className={Style.Header}>
          <span className={Style.Text}>Sorting</span>
          {this.renderActive()}

        </div>
        <div className={Style.List}>
          {_.map(this.getData(), this.renderItem)}
        </div>
      </div>
    );
  };

  private readonly renderActive = () => {
    const active = this.state.active ?? this.getActive();
    if (!active) return null;

    return (
      <div className={Style.Value}>
        <span className={Style.Name} style={{width: Helper.getWidestText(_.map(this.getData(), item => item.text ?? ""))}}>{active.text}</span>
        {this.renderSortIcon()}
      </div>
    );
  };

  private readonly renderSortIcon = () => {
    const active = this.getActive();
    if (!active || !active.order) return null;

    const order = active == this.state.active ? this.getNextOrder(active) : active.order;

    return (
      <Icon type={order === Order.ASC ? IconType.CARET_UP : IconType.CARET_DOWN}/>
    );
  };

  private readonly renderItem = (sortable: SortableItem, text: string) => {
    const active = !!sortable.order;
    const disabled = sortable.disabled ?? false;

    return (
      <div key={text} className={Style.Wrapper} data-active={active}>
        <Button className={Style.Button} value={sortable} icon={sortable.icon} disabled={disabled}
                onClick={this.eventItemButtonClick} onMouseEnter={this.eventItemMouseEnter} onMouseLeave={this.eventItemMouseLeave}/>
      </div>
    );
  };

  private readonly eventItemMouseEnter = (value: SortableItem) => this.setState({active: value});
  private readonly eventItemMouseLeave = () => this.setState({active: undefined});
  private readonly eventItemButtonClick = (value: SortableItem, event: React.MouseEvent<HTMLDivElement>) => this.change(value);
}

export interface SortableItem {
  order?: Order
  text?: string
  icon?: IconType
  disabled?: boolean
}

export type SortableCollection<V extends {} = {}> = { [K in keyof V]: SortableItem }

interface SortableProps<V extends {} = {}> {
  className?: string
  children: SortableCollection<V>

  onChange(value: SortableCollection<V>): void
}

interface State<V extends {} = {}> {
  active?: SortableItem
}
