import _ from "lodash";
import React from "react";
import IconType from "../../enums/IconType";
import InputType from "../../enums/InputType";
import Helper from "../../Helper";
import Table from "../Base/Table";
import Button from "../Form/Button";
import Input from "../Form/Input";
import Sortable, {SortableCollection} from "../Form/Sortable";
import Style from "./DataTable.module.scss";
import Pagination from "./Pagination";
import Conditional from "../Application/Conditional";
import Component from "../Application/Component";

export default class DataTable<K extends string> extends Component<DataTableProps<K>, State> {

  public static defaultPageSize = [10, 25, 50, 100];

  constructor(props: DataTableProps<K>) {
    super(props);

    const list = _.uniq([...DataTable.defaultPageSize, this.props.size]).sort((a, b) => a > b ? 1 : -1);
    const index = _.findIndex(list, value => value === this.props.size);

    this.state = {
      loading:         false,
      flag_dropdown:   false,
      page_size_list:  list,
      page_size_index: index,
      page_size_input: this.props.size.toString(),
    };
  }

  public readonly search = (filter: Partial<DataTableFilter<K>> = {}) => {
    const search = filter.search ?? this.props.search ?? "";
    const size = filter.size ?? this.props.size;
    const page = filter.page ?? this.props.page;
    const order = filter.order ?? this.props.order;

    this.props.onChange({search, size, page, order});
    this.searchInternal();
  };

  private readonly searchInternal = _.debounce(async () => {
    await this.props.onSearch();
  }, 500);

  public readonly componentDidMount = () => {
    this.search();
  };

  public render() {
    const {count, page, size, search, order, loading, placeholder, children, onCreate} = this.props;
    const {page_size_list, page_size_index, page_size_input} = this.state;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <div className={Style.Header}>
          <div className={Style.Left}>
            <Sortable onChange={this.eventOrderChange}>
              {order}
            </Sortable>
          </div>

          <div className={Style.Center}>

          </div>

          <div className={Style.Right}>

            <Input className={Style.Size} label={"Results per page"} index={page_size_index} value={page_size_input}
                   onChange={this.eventSizeInputChange} onReset={this.eventSizeInputReset}
                   onIndexChange={this.eventSizeIndexChange} onIndexCommit={this.eventSizeIndexCommit}>
              {page_size_list}
            </Input>

            <Conditional condition={search !== undefined}>
              <Input className={Style.Search} type={InputType.TEXT} label={"Search"} value={search} onChange={this.eventSearchChange}/>
            </Conditional>

            <Conditional condition={onCreate}>
              <Button icon={IconType.UI_ADD} value={search} onClick={onCreate}/>
            </Conditional>

          </div>
        </div>

        <Table className={Style.Body} loader={loading} placeholder={placeholder}>
          {children}
        </Table>

        <div className={Style.Footer}>

          <div className={Style.Left}>

          </div>

          <div className={Style.Center}>
            <Pagination className={Style.Pagination} current={page} total={Helper.getPageTotal(count, size)} onChange={this.eventPageChange}/>
          </div>

          <div className={Style.Right}>

          </div>

        </div>
      </div>
    );
  }

  private readonly eventPageChange = (page: number) => {
    this.search({page});
  };

  private readonly eventOrderChange = (order: SortableCollection<K>) => {
    this.search({order});
  };

  private readonly eventSearchChange = (search: string) => {
    this.search({search});
  };

  private readonly eventSizeIndexCommit = (page_size_index: number) => {
    const size = this.state.page_size_list[page_size_index];
    this.setState({page_size_index, page_size_input: size.toString()});
    this.search({size});
  };

  private readonly eventSizeInputReset = () => this.setState({
    page_size_index: _.findIndex(this.state.page_size_list, value => value === this.props.size),
    page_size_input: this.props.size.toString(),
  });

  private readonly eventSizeInputChange = (page_size_input: string) => {
    this.setState({page_size_input});
  };

  private readonly eventSizeIndexChange = (page_size_index: number) => {
    this.setState({page_size_index});
  };


}

export type DataTableFilter<K extends string> = Pick<Required<DataTableProps<K>>, "search" | "size" | "page" | "order">;

export interface DataTableProps<K extends string> {
  count: number
  page: number
  size: number
  search?: string
  order: SortableCollection<K>

  loading?: string
  className?: string
  placeholder?: string

  onCreate?(search: string): void
  onChange(filter: DataTableFilter<K>): void
  onSearch(): void
}

interface State {
  flag_dropdown: boolean
  loading: boolean

  page_size_list: number[]
  page_size_index: number
  page_size_input: string
}
