import _ from "lodash";
import React from "react";
import {NextPageContext} from "next";
import Moment from "moment";
import Helper from "../../Helper";
import Button from "../../components/Form/Button";
import Redirect from "../../components/Application/Redirect";
import ColumnText from "../../components/Text/ColumnText";
import {SortableCollection} from "../../components/Form/Sortable";
import DataTable, {DataTableFilter} from "../../components/Table/DataTable";
import IconType from "../../enums/IconType";
import Order from "../../../common/enums/Order";
import PageEntity from "../../entities/page/PageEntity";
import Style from "./index.module.scss";
import Dialog from "../../components/Application/Dialog";
import PageCreateForm from "../../forms/entities/PageCreateForm";
import EllipsisText from "../../components/Text/EllipsisText";
import Component from "../../components/Application/Component";

export default class PageIndexPage extends Component<PageIndexPageProps, State> {

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): PageIndexPageProps {
    const order = Helper.getQueryProp(context.query[PageIndexPageQuery.ORDER], {time_created: Order.DESC} as PageIndexPageProps[PageIndexPageQuery.ORDER]);

    return {
      [PageIndexPageQuery.PAGE]:   Helper.getQueryProp(context.query[PageIndexPageQuery.PAGE], "1"),
      [PageIndexPageQuery.SIZE]:   Helper.getQueryProp(context.query[PageIndexPageQuery.SIZE], "10"),
      [PageIndexPageQuery.ORDER]:  typeof order === "string" ? order[0] === "-" ? {[order.substr(1)]: Order.DESC} : {[order]: Order.ASC} : order,
      [PageIndexPageQuery.SEARCH]: Helper.getQueryProp(context.query[PageIndexPageQuery.SEARCH], ""),
    };
  }

  constructor(props: PageIndexPageProps) {
    super(props);
    this.state = {
      page:   +props[PageIndexPageQuery.PAGE],
      size:   +props[PageIndexPageQuery.SIZE],
      order:  {
        id:           {order: props[PageIndexPageQuery.ORDER]["id"], text: "ID", icon: IconType.ID},
        name:         {order: props[PageIndexPageQuery.ORDER]["name"], text: "Name", icon: IconType.TAG},
        time_created: {order: props[PageIndexPageQuery.ORDER]["time_created"], text: "Time Created", icon: IconType.CLOCK},
      },
      search: props[PageIndexPageQuery.SEARCH],

      list:    [],
      count:   0,
      loading: false,
    };
  }

  public componentDidMount() {

  }

  public render() {
    const {count, page, list, order, search, size, loading} = this.state;

    return (
      <div className={Style.Component}>
        <DataTable className={Style.Table} count={count} page={page} size={size} order={order} search={search} loading={loading}
                   onCreate={this.eventCreate} onChange={this.eventChange} onSearch={this.eventSearch}>
          {_.map(list, this.renderRow)}
        </DataTable>
      </div>
    );
  }

  private readonly renderRow = (entity: PageEntity, index: number = 0) => {
    return (
      <div key={index} className={Style.Row}>
        <ColumnText className={Style.Name} title={"Name"}>
          {entity.name}
        </ColumnText>

        <ColumnText className={Style.Path} title={"Path"}>
          <Redirect href={`${location.href}/${entity.path}`}>
            <EllipsisText>
              {`/${entity.path}`}
            </EllipsisText>
          </Redirect>
        </ColumnText>

        <ColumnText className={Style.TimeUpdated} title={"Last updated"}>
          {Moment(entity.time_updated).format("DD-MM-YYYY HH:mm:ss")}
        </ColumnText>

        <ColumnText className={Style.TimeCreated} title={"Created at"}>
          {Moment(entity.time_created).format("DD-MM-YYYY HH:mm:ss")}
        </ColumnText>

        <ColumnText className={Style.UserCreated} title={"Created by"}>
          {entity.user.username}
        </ColumnText>

        <Redirect className={Style.Redirect} href={`/page/${entity.id}/edit`}>
          <Button icon={IconType.EXTERNAL_LINK}/>
        </Redirect>
      </div>
    );
  };

  private readonly eventCreate = async (name: string) => {
    this.setState({dialog: Dialog.show(<PageCreateForm initial={new PageEntity({name})} onSubmit={this.eventCreateSubmit}/>, {title: "Create new page"})});
  };

  private readonly eventCreateSubmit = async () => {
    Dialog.close(this.state.dialog);
    this.setState({loading: true});
    await this.eventSearch();
  };

  private readonly eventChange = ({search, size, page, order}: DataTableFilter<PageIndexPageOrder>) => {
    this.setState({search, size, page, order, loading: true});
  };

  private readonly eventSearch = async () => {
    const params = {name: this.state.search};
    const skip = (this.state.page - 1) * this.state.size;
    const limit = skip + this.state.size;
    const order = _.mapValues(this.state.order, value => value.order);

    const count = await PageEntity.getCount(params);
    const list = await PageEntity.getMany(params, {order, skip, limit});

    this.setState({count, list, loading: false});
  };

}

type PageIndexPageOrder = "id" | "name" | "time_created";

export enum PageIndexPageQuery {
  PAGE = "page",
  SIZE = "size",
  ORDER = "order",
  SEARCH = "search",
}

export interface PageIndexPageProps {
  [PageIndexPageQuery.PAGE]: string
  [PageIndexPageQuery.SIZE]: string
  [PageIndexPageQuery.ORDER]: {[key: string]: Order}
  [PageIndexPageQuery.SEARCH]: string
}

interface State {
  page: number
  size: number
  order: SortableCollection<PageIndexPageOrder>
  search: string

  dialog?: string

  list: PageEntity[]
  count: number
  loading: boolean
}
