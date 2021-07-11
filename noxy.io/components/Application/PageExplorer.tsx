import React from "react";
import Style from "./PageExplorer.module.scss";
import PageEntity from "../../entities/page/PageEntity";
import Loader from "../UI/Loader";
import Pagination from "../Table/Pagination";
import Conditional from "./Conditional";
import Button from "../Form/Button";
import IconType from "../../enums/IconType";
import Sortable, {SortableCollection} from "../Form/Sortable";
import Order from "../../../common/enums/Order";
import Input from "../Form/Input";
import PageHeader from "../UI/PageHeader";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import Redirect from "./Redirect";
import Component from "./Component";
import Dialog from "./Dialog";
import PageCreateForm from "../../forms/entities/PageCreateForm";
import Router from "next/router";
import PageBlockExplorer from "./PageBlockExplorer";

export default class PageExplorer extends Component<PageExplorerProps, State> {

  constructor(props: PageExplorerProps) {
    super(props);
    this.state = {
      loading: true,

      order:       {
        id:           {order: undefined, text: "ID", icon: IconType.ID},
        name:         {order: undefined, text: "Name", icon: IconType.TAG},
        time_created: {order: Order.DESC, text: "Time Created", icon: IconType.CLOCK},
      },
      search:      "",
      flag_public: false,

      page_list:          [],
      pagination_total:   1,
      pagination_current: 1,
    };
  }

  public async componentDidMount() {
    const page_list = await PageEntity.getMany({flag_public: this.state.flag_public});
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
          <Button icon={IconType.UI_ADD} onClick={this.eventCreatePageDialog}>Create new post</Button>
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
        <PageBlockExplorer readonly={true} page={page} onChange={() => {}}/>
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

  private readonly eventCreatePageDialog = () => {
    this.setState({dialog: Dialog.show(<PageCreateForm initial={new PageEntity({name: this.state.search})} onSubmit={this.eventCreatePageSubmit}/>, {title: "Create new page"})});
  };

  private readonly eventCreatePageSubmit = async (page: PageEntity) => {
    await Router.push(`/page/${page.id}/edit`);
    Dialog.close(this.state.dialog);
  };
}

type IndexPageOrder = "id" | "name" | "time_created";

export interface PageExplorerProps {

}

interface State {
  dialog?: string
  loading: boolean

  order: SortableCollection<IndexPageOrder>
  search: string
  flag_public: boolean

  page_list: PageEntity[]
  pagination_total: number
  pagination_current: number
}
