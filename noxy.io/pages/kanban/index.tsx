import React from "react";
import DataTable, {DataTableFilter} from "../../components/Table/DataTable";
import Global from "../../Global";
import {NextPageContext} from "next";
import BoardEntity from "../../entities/board/BoardEntity";
import Style from "./index.module.scss";
import ColumnText from "../../components/Text/ColumnText";
import Button from "../../components/Form/Button";
import Redirect from "../../components/Application/Redirect";
import IconType from "../../enums/IconType";
import _ from "lodash";
import {SortableCollection} from "../../components/Form/Sortable";
import Order from "../../../common/enums/Order";
import Helper from "../../Helper";
import EllipsisText from "../../components/Text/EllipsisText";
import Moment from "moment";

export default class BoardIndexPage extends React.Component<BoardIndexPageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): BoardIndexPageProps {
    const order = Helper.getQueryProp(context.query[BoardIndexPageQuery.ORDER], {time_created: Order.DESC} as BoardIndexPageProps[BoardIndexPageQuery.ORDER]);

    return {
      [BoardIndexPageQuery.PAGE]:   Helper.getQueryProp(context.query[BoardIndexPageQuery.PAGE], "1"),
      [BoardIndexPageQuery.SIZE]:   Helper.getQueryProp(context.query[BoardIndexPageQuery.SIZE], "10"),
      [BoardIndexPageQuery.ORDER]:  typeof order === "string" ? order[0] === "-" ? {[order.substr(1)]: Order.DESC} : {[order]: Order.ASC} : order,
      [BoardIndexPageQuery.SEARCH]: Helper.getQueryProp(context.query[BoardIndexPageQuery.SEARCH], ""),
    };
  }

  constructor(props: BoardIndexPageProps) {
    super(props);
    this.state = {
      page:   +props[BoardIndexPageQuery.PAGE],
      size:   +props[BoardIndexPageQuery.SIZE],
      order:  {
        id:           {order: props[BoardIndexPageQuery.ORDER]["id"], text: "ID", icon: IconType.ID},
        name:         {order: props[BoardIndexPageQuery.ORDER]["name"], text: "Name", icon: IconType.TAG},
        time_created: {order: props[BoardIndexPageQuery.ORDER]["time_created"], text: "Time Created", icon: IconType.CLOCK},
      },
      search: props[BoardIndexPageQuery.SEARCH],

      list:  [],
      count: 0,
    };
  }

  public componentDidMount() {

  }

  public render() {
    const {count, page, list, order, search, size} = this.state;

    return (
      <div className={Style.Component}>
        <DataTable className={Style.Table} count={count} page={page} size={size} order={order} search={search} onCreate={this.eventCreate} onChange={this.eventChange} onSearch={this.eventSearch}>
          {_.map(list, this.renderRow)}
        </DataTable>
      </div>
    );
  }

  private readonly renderRow = (entity: BoardEntity, index: number = 0) => {
    const categories = entity.board_category_list.length ? _.map(entity.board_category_list, category => category.name).join(", ") : "-";

    return (
      <div key={index} className={Style.Row}>
        <ColumnText className={Style.Name} title={"Name"}>
          {entity.name}
        </ColumnText>

        <ColumnText className={Style.Category} title={"Categories"}>
          <EllipsisText>{categories}</EllipsisText>
        </ColumnText>

        <ColumnText className={Style.TimeUpdated} title={"Last updated"}>
          {Moment(entity.time_updated).format("DD-MM-YYYY HH:mm:ss")}
        </ColumnText>

        <ColumnText className={Style.TimeCreated} title={"Created at"}>
          {Moment(entity.time_created).format("DD-MM-YYYY HH:mm:ss")}
        </ColumnText>

        <Redirect className={Style.Redirect} href={`/board/${entity.id}`}>
          <Button icon={IconType.EXTERNAL_LINK}/>
        </Redirect>
      </div>
    );
  };

  private readonly eventCreate = async (name: string) => {
    await BoardEntity.createOne({name});
    await this.eventSearch();
  };

  private readonly eventChange = ({search, size, page, order}: DataTableFilter<BoardIndexPageOrder>) => {
    this.setState({search, size, page, order});
  };

  private readonly eventSearch = async () => {
    const params = {name: this.state.search};
    const skip = (this.state.page - 1) * this.state.size;
    const limit = skip + this.state.size;
    const order = _.mapValues(this.state.order, value => value.order);

    const count = await BoardEntity.count(params);
    const list = await BoardEntity.findMany(params, {order, skip, limit});
    for (let entity of list) entity.board_category_list.sort((a, b) => a.time_created > b.time_created ? 1 : -1);

    this.setState({count, list});
  };

}

type BoardIndexPageOrder = "id" | "name" | "time_created";

export enum BoardIndexPageQuery {
  PAGE = "page",
  SIZE = "size",
  ORDER = "order",
  SEARCH = "search",
}

export interface BoardIndexPageProps {
  [BoardIndexPageQuery.PAGE]: string
  [BoardIndexPageQuery.SIZE]: string
  [BoardIndexPageQuery.ORDER]: {[key: string]: Order}
  [BoardIndexPageQuery.SEARCH]: string
}

interface State {
  page: number
  size: number
  order: SortableCollection<BoardIndexPageOrder>
  search: string

  count: number
  list: BoardEntity[]
}
