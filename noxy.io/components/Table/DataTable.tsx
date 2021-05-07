import _ from "lodash";
import React from "react";
import IconType from "../../enums/IconType";
import InputType from "../../enums/InputType";
import Helper from "../../Helper";
import Dropdown from "../Base/Dropdown";
import Table from "../Base/Table";
import Button from "../Form/Button";
import Input from "../Form/Input";
import Sortable, {SortableCollection} from "../Form/Sortable";
import Style from "./DataTable.module.scss";
import Pagination from "./Pagination";

export default class DataTable<O extends {}> extends React.Component<DataTableProps<O>, State> {

  public static defaultPageSize = [10, 25, 50, 100];

  constructor(props: DataTableProps<O>) {
    super(props);
    this.state = {
      flag_dropdown: false,
      ...this.parsePageSizeCollection(DataTable.defaultPageSize),
    };
  }


  public readonly search = ({search = this.props.search ?? "", size = this.props.size, page = this.props.page, order = this.props.order}: Partial<DataTableFilter<O>> = {}) => {
    if (this.props.size === size && this.props.page === page && this.props.search === search && _.isEqual(this.props.order, order)) return;
    this.props.onSearch({search, size, page, order});
  };


  private readonly parsePageSizeCollection = (values: number[] = DataTable.defaultPageSize, ...extras: number[]): Pick<State, "page_size_collection" | "page_size_index" | "page_size_input"> => {
    if (extras) values = _.uniq([...values, ...extras]).sort((a, b) => a - b);
    const collection = _.reduce(values, (result, option) => _.set(result, `${option} per page`, option), {});

    return {
      page_size_collection: collection,
      page_size_index:      _.findIndex(_.values(collection), value => value === this.props.size),
      page_size_input:      _.findKey(collection, value => value === this.props.size) ?? "ERROR",
    };
  };


  public readonly componentDidMount = () => {
    this.setState({...this.state, ...this.parsePageSizeCollection(this.props.options, this.props.size)});
    this.props.onSearch({search: this.props.search ?? "", size: this.props.size, page: this.props.page, order: this.props.order});
  };


  public readonly componentDidUpdate = (prevProps: Readonly<DataTableProps<O>>) => {
    const next_state = {} as State;

    if (!_.isEqual(this.props.options, prevProps.options)) {
      const {page_size_collection, page_size_index, page_size_input} = this.parsePageSizeCollection(this.props.options ?? DataTable.defaultPageSize, this.props.size);
      next_state.page_size_input = page_size_input;
      next_state.page_size_index = page_size_index;
      next_state.page_size_collection = page_size_collection;
    }

    if (_.size(next_state)) this.setState(next_state);
  };


  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <div className={Style.Header}>
          <div className={Style.HeaderRow}>
            {typeof this.props.header === "function" ? this.props.header() : this.props.header}
          </div>
          <div className={Style.HeaderFilter}>
            {this.renderInput()}
            <Input className={Style.HeaderFilterComboBox} label={"Page size"} index={this.state.page_size_index} value={this.state.page_size_input}
                   onChange={this.eventTableHeaderFilterComboBoxInputChange} onReset={this.eventTableHeaderFilterComboBoxReset}
                   onIndexChange={this.eventTableHeaderFilterComboBoxIndexChange} onIndexCommit={this.eventTableHeaderFilterComboBoxIndexCommit}>
              {_.map(this.state.page_size_collection, this.renderComboBoxListItem)}
            </Input>
            <Button className={Style.HeaderFilterButton} icon={IconType.FILTER} onClick={this.eventTableHeaderFilterButtonClick}/>
            <Dropdown className={Style.HeaderFilterDropdown} hidden={!this.state.flag_dropdown}>
              <Sortable onChange={this.eventFilterOrderChange}>
                {this.props.order}
              </Sortable>
            </Dropdown>
          </div>
        </div>
        <Table className={Style.Body} loader={this.props.loader} placeholder={this.props.placeholder}>
          {this.props.children}
        </Table>
        <div className={Style.Footer}>
          <Pagination className={Style.Pagination} current={this.props.page} total={Helper.getPageTotal(this.props.count, this.props.size)} onChange={this.eventPaginationChange}/>
        </div>
      </div>
    );
  }

  private readonly renderInput = () => {
    if (this.props.search === undefined) return;

    return (
      <Input className={Style.HeaderFilterInput} type={InputType.TEXT} label={"Search"} value={this.props.search} onChange={this.eventTableHeaderFilterInputSearch}/>
    );
  };

  private readonly renderComboBoxListItem = (value: number, key: string) => {
    return (
      <span key={key} className={Style.HeaderFilterComboBoxItem}>
        {key}
      </span>
    );
  };

  private readonly eventPaginationChange = (page: number) => this.search({page});

  private readonly eventTableHeaderFilterButtonClick = () => this.setState({flag_dropdown: !this.state.flag_dropdown});
  private readonly eventTableHeaderFilterInputSearch = (search: string) => this.search({search});
  private readonly eventFilterOrderChange = (order: SortableCollection<O>) => this.search({order});
  private readonly eventTableHeaderFilterComboBoxReset = () => this.setState({
    page_size_index: _.findIndex(_.values(this.state.page_size_collection), value => value === this.props.size),
    page_size_input: _.findKey(this.state.page_size_collection, value => value === this.props.size) ?? "",
  });

  private readonly eventTableHeaderFilterComboBoxInputChange = (page_size_input: string) => this.setState({page_size_input});
  private readonly eventTableHeaderFilterComboBoxIndexChange = (page_size_index: number) => this.setState({page_size_index});
  private readonly eventTableHeaderFilterComboBoxIndexCommit = (index: number) => {
    this.setState({page_size_index: index, page_size_input: _.keys(this.state.page_size_collection)[index]});
    this.search({size: _.values(this.state.page_size_collection)[index]});
  };

}

export type DataTableFilter<O extends {}> = Pick<DataTableProps<O>, "search" | "size" | "page" | "order">;

export interface DataTableProps<O extends {}> {
  count: number

  page: number
  size: number
  search?: string
  order: SortableCollection<O>

  header?: null | JSX.Element | JSX.Element[] | (() => null | JSX.Element | JSX.Element[])
  options?: number[]
  loader?: string | boolean
  placeholder?: string
  className?: string

  onSearch: (filter: DataTableFilter<O>) => void
}

interface State {
  flag_dropdown: boolean

  page_size_collection: {[key: string]: number}
  page_size_index: number
  page_size_input: string
}
