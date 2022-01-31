import _ from "lodash";
import React from "react";
import Util from "../../../common/services/Util";
import IconType from "../../enums/IconType";
import InputType from "../../enums/InputType";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import Table from "./Table";
import AutoComplete from "../Form/AutoComplete";
import Button from "../Form/Button";
import Input from "../Form/Input";
import Sortable, {SortableCollection} from "../Form/Sortable";
import Style from "./DataTable.module.scss";
import TablePagination from "./TablePagination";

export default class DataTable<K extends string> extends Component<DataTableProps<K>, State> {

  public static defaultPageSize = ["10", "25", "50", "100"];

  constructor(props: DataTableProps<K>) {
    super(props);
    this.state = {
      loading:   false,
      page_size: (this.props.size ?? DataTable.defaultPageSize[0]).toString(),
    };
  }

  public search(filter: Partial<DataTableFilter<K>> = {}) {
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
    const {search = "", count, page, size, order, loading, className, children, onCreate} = this.props;
    const page_size_index = DataTable.defaultPageSize.findIndex(entity => entity === this.state.page_size);

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>

        <div className={Style.Header}>
          <div className={Style.Left}>
            <Sortable onChange={this.eventOrderChange}>{order}</Sortable>
          </div>

          <div className={Style.Center}/>

          <div className={Style.Right}>
            <AutoComplete className={Style.Size} label={"Entries"} value={this.state.page_size} index={page_size_index}
                          onChange={this.eventPageSizeChange} onIndexChange={this.eventPageSizePreview} onInputChange={this.eventPageSizePreview} onReset={this.eventPageSizeReset}>
              {DataTable.defaultPageSize}
            </AutoComplete>

            <Conditional condition={search !== undefined}>
              <Input className={Style.Search} type={InputType.TEXT} label={"Search"} value={search} onChange={this.eventSearchChange}/>
            </Conditional>

            <Conditional condition={onCreate}>
              <Button icon={IconType.UI_ADD} value={search} onClick={onCreate}/>
            </Conditional>
          </div>
        </div>

        <Table className={Style.Body} loading={loading}>
          {children}
        </Table>

        <div className={Style.Footer}>
          <div className={Style.Left}/>

          <div className={Style.Center}>
            <TablePagination className={Style.Pagination} current={page} total={Util.getSampleCount(count, size)} onChange={this.eventPageChange}/>
          </div>

          <div className={Style.Right}/>
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

  private readonly eventPageSizePreview = (value: number | string) => {
    this.setState({page_size: typeof value === "string" ? value : DataTable.defaultPageSize[value]});
  };

  private readonly eventPageSizeChange = (page_size: string) => {
    const size = Util.clamp(+page_size, 100, 10);
    if (isNaN(size)) return this.eventPageSizeReset();
    this.search({size});
    this.setState({page_size: size.toString()});
  };

  private readonly eventPageSizeReset = () => {
    this.setState({page_size: this.props.size.toString()});
  };
}

export type DataTableFilter<K extends string> = Pick<Required<DataTableProps<K>>, "search" | "size" | "page" | "order">;

export interface DataTableProps<K extends string> {
  count: number;
  page: number;
  size: number;
  search?: string;
  order: SortableCollection<K>;

  loading?: boolean;
  className?: string;
  placeholder?: string;

  onCreate?(search: string): void;
  onChange(filter: DataTableFilter<K>): void;
  onSearch(): void;
}

interface State {
  loading: boolean;

  page_size: string;
}
