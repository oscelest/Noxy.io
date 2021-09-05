import _ from "lodash";
import React from "react";
import Util from "../../../common/services/Util";
import IconType from "../../enums/IconType";
import InputType from "../../enums/InputType";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import Table from "../Base/Table";
import AutoComplete from "../Form/AutoComplete";
import Button from "../Form/Button";
import Input from "../Form/Input";
import Sortable, {SortableCollection} from "../Form/Sortable";
import Style from "./DataTable.module.scss";
import Pagination from "./Pagination";

export default class DataTable<K extends string> extends Component<DataTableProps<K>, State> {
  
  public static defaultPageSize = ["10", "25", "50", "100"];
  
  constructor(props: DataTableProps<K>) {
    super(props);
    this.state = {
      loading:        false,
      page_size_list: DataTable.getPageSizeList(this.props.size.toString()),
    };
  }
  
  public static getPageSizeList(size?: string) {
    return (size !== undefined && !DataTable.defaultPageSize.includes(size) ? [...DataTable.defaultPageSize, size] : DataTable.defaultPageSize).sort((a, b) => +a > +b ? 1 : -1);
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
    const {page_size_list} = this.state;
    const {count, page, size, order, loading, children, onCreate} = this.props;
    
    const search = this.props.search ?? "";
    const page_size_value = this.state.page_size_value ?? size.toString();
    const page_size_index = this.state.page_size_index ?? page_size_list.findIndex(entity => entity === page_size_value);
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
            
            <AutoComplete className={Style.Size} label={"Entries"} index={page_size_index} value={page_size_value}
                          onChange={this.eventPageSizeChange} onReset={this.eventPageSizeReset}>
              {page_size_list}
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
          
          <div className={Style.Left}>
          
          </div>
          
          <div className={Style.Center}>
            <Pagination className={Style.Pagination} current={page} total={Util.getSampleCount(count, size)} onChange={this.eventPageChange}/>
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
  
  private readonly eventPageSizeReset = () => {
    this.setState({page_size_index: undefined, page_size_value: undefined});
  };
  
  private readonly eventPageSizeChange = (page_size_index: number, value: string) => {
    if (!isNaN(+value)) {
      const size = Util.clamp(+value, 1000, 10)
      this.search({size});
      this.setState({page_size_index: undefined, page_size_value: undefined, page_size_list: DataTable.getPageSizeList(size.toString())});
    }
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
  
  page_size_list: string[];
  page_size_index?: number;
  page_size_value?: string;
}
