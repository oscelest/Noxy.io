import _ from "lodash";
import React from "react";
import IconType from "../../enums/IconType";
import FatalException from "../../exceptions/FatalException";
import Helper from "../../Helper";
import Conditional from "../Application/Conditional";
import Icon from "../Base/Icon";
import EllipsisText from "../Text/EllipsisText";
import Loader from "../UI/Loader";
import Button from "./Button";
import Style from "./EntityPicker.module.scss";
import Input from "./Input";

export default class EntityPicker<V extends {toString(): string}> extends React.Component<EntityPickerProps<V>, State> {

  constructor(props: EntityPickerProps<V>) {
    super(props);
    this.state = {
      loading: false,
      search:  "",
    };
  }


  public readonly search = (search: string = this.state.search) => {
    this.setState({loading: true, search});
    this.searchInternal();
  };

  private readonly searchInternal = _.debounce(
    async () => {
      const next_state = {} as State;

      try {
        next_state.loading = false;
        await this.props.onSearch?.(this.state.search);
      }
      catch (error) {
        console.error(error);
      }
      this.setState(next_state);
    },
    500,
  );

  public readonly create = async (search: string = this.state.search) => {
    const entity = await this.props.onCreate?.(search, this.props.selected);
    if (!entity) throw new FatalException("", "");

    this.setState({search: ""});
    if (this.props.onCompare) {
      const selected = _.uniqBy([...this.props.selected, entity], value => this.props.onCompare!(value));
      const available = _.filter(this.props.available, value => this.props.onCompare!(value) !== this.props.onCompare!(entity));
      this.props.onChange(selected, available);
    }
    else {
      const selected = _.uniqBy([...this.props.selected, entity], value => value.toString());
      const available = _.filter(this.props.available, value => value.toString() !== entity.toString());
      this.props.onChange(selected, available);
    }
  };

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

  public componentDidMount(): void {
    this.props.onSearch?.(this.state.search);
  }

  public render() {
    const {loading, search} = this.state;
    const selected = this.getSortedList(this.props.selected);
    const available = this.getSortedList(this.props.available);

    const classes = [Style.Component];
    if (this.props.horizontal) classes.push(Style.Horizontal);
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <Conditional condition={this.props.onSearch}>
          <div className={Style.Search}>
            <Input className={Style.Input} label={"Search for tags"} value={search} onChange={this.search}/>
            <Conditional condition={this.props.onCreate}>
              <Button className={Style.Button} icon={IconType.UI_ADD} value={search} disabled={search.length < 3} onClick={this.create}/>
            </Conditional>
          </div>
        </Conditional>

        <div className={Style.List}>
          <Conditional condition={selected.length || this.props.horizontal}>
            <div className={Style.Selected}>
              {_.map(selected, this.renderSelected)}
            </div>
          </Conditional>
          <Loader show={loading}>
            <div className={Style.Available}>
              {_.map(available, this.renderAvailable)}
            </div>
          </Loader>
        </div>
      </div>
    );
  }

  private readonly renderSelected = (item: V, index: number = 0) => {
    return (
      <div key={index} className={Style.Item}>
        <div className={Style.Container} onClick={this.eventItemDeselect}>
          <Icon className={Style.Icon} type={IconType.UI_REMOVE}/>
          <EllipsisText className={Style.Text}>{this.getItemName(item)}</EllipsisText>
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
          <EllipsisText className={Style.Text}>{this.getItemName(item)}</EllipsisText>
        </div>
        <Conditional condition={this.props.onDelete}>
          <Icon className={Style.Delete} type={IconType.BIN} onClick={this.eventItemDeleteAvailable}/>
        </Conditional>
      </div>
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
    this.props.onChange([...this.props.selected, item], _.filter(this.props.available, value => value !== item));
  };

  private readonly eventItemDeselect = (event: React.MouseEvent<HTMLElement>) => {
    const item = this.getItemFromEvent(event, this.props.selected);
    this.props.onDeselect?.(item);
    this.props.onChange(_.filter(this.props.selected, value => value !== item), [...this.props.available, item]);
  };
}

export interface EntityPickerProps<V> {
  selected: V[]
  available: V[]

  horizontal?: boolean
  className?: string

  onSort?(previous: V, next: V): number
  onCreate?(search: string, selected: V[]): V | Promise<V>
  onSearch?(search: string): void | Promise<void>
  onCompare?(entity: V): string | number | boolean | object
  onRender?(selected: V): string
  onDelete?(selected: V): void
  onSelect?(selected: V): void
  onDeselect?(deselected: V): void
  onChange(selected: V[], available: V[]): void
}

interface State {
  search: string
  loading: boolean
}
