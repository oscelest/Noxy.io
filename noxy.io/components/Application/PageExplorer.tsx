import React from "react";
import Style from "./PageExplorer.module.scss";
import PageEntity from "../../entities/page/PageEntity";
import Markdown from "../UI/Markdown";
import Loader from "../UI/Loader";
import Pagination from "../Table/Pagination";
import Conditional from "./Conditional";
import Button from "../Form/Button";
import IconType from "../../enums/IconType";
import Sortable, {SortableCollection} from "../Form/Sortable";
import Order from "../../../common/enums/Order";
import Input from "../Form/Input";
import PageHeader from "../UI/PageHeader";
import Global from "../../Global";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import Redirect from "./Redirect";
import BaseEntity from "../../../common/classes/BaseEntity";

export default class PageExplorer extends React.Component<PageExplorerProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: PageExplorerProps) {
    super(props);
    this.state = {
      loading: true,

      order:  {
        id:           {order: undefined, text: "ID", icon: IconType.ID},
        name:         {order: undefined, text: "Name", icon: IconType.TAG},
        time_created: {order: Order.DESC, text: "Time Created", icon: IconType.CLOCK},
      },
      search: "",

      page_list:          [],
      pagination_total:   1,
      pagination_current: 1,
    };
  }

  public async componentDidMount() {
    const page_list = await PageEntity.findMany();
    this.setState({page_list, loading: false});
  }

  public render() {
    const {loading, order, search, page_list, pagination_current, pagination_total} = this.state;

    return (
      <div className={Style.Component}>
        <div className={Style.Content}>
          <div className={Style.List}>
            <Loader show={loading}>
              {page_list.map(this.renderPage)}
            </Loader>
          </div>
          <Conditional condition={pagination_total > 1}>
            <Pagination className={Style.Pagination} total={pagination_total} current={pagination_current} onChange={this.eventPaginationChange}/>
          </Conditional>
        </div>
        <div className={Style.Sidebar}>
          <Redirect className={Style.Create} href={`/page/${BaseEntity.defaultID}/edit`}>
            <Button icon={IconType.UI_ADD}>Create new post</Button>
          </Redirect>
          <Input label={"Search"} value={search} onChange={this.eventSearchChange}/>
          <Sortable onChange={this.eventOrderChange}>
            {order}
          </Sortable>
        </div>
      </div>
    );
  }

  private readonly renderPage = (page: PageEntity, index: number = 0) => {
    return (
      <div key={index} className={Style.Page}>
        <PageHeader title={page.name}>
          <Conditional condition={this.context.hasPermission(PermissionLevel.FILE)}>
            <Redirect href={`/page/${page.id}/edit`}>
              <Button icon={IconType.EDIT}>Edit</Button>
            </Redirect>
          </Conditional>
        </PageHeader>
        <Markdown className={Style.Markdown}>{page.content}</Markdown>
      </div>
    );
  };

  private readonly eventPaginationChange = (pagination_current: number) => {
    this.setState({pagination_current});
  };

  private readonly eventOrderChange = (order: SortableCollection<IndexPageOrder>) => {
    this.setState({order});
  };

  private readonly eventSearchChange = (search: string) => {
    this.setState({search});
  };
}

type IndexPageOrder = "id" | "name" | "time_created";

export interface PageExplorerProps {

}

interface State {
  loading: boolean

  order: SortableCollection<IndexPageOrder>
  search: string

  page_list: PageEntity[]
  pagination_total: number
  pagination_current: number
}
