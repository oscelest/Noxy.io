import React from "react";
import {NextPageContext} from "next";
import Global from "../../Global";
import Helper from "../../Helper";
import BoardEntity from "../../entities/board/BoardEntity";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import BoardElement from "../../components/Application/BoardElement";
import Style from "./[id].module.scss";

export default class BoardIDPage extends React.Component<BoardIDPageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): BoardIDPageProps {
    return {
      [BoardIDPageQuery.ID]: Helper.getQueryProp(context.query[BoardIDPageQuery.ID], new BoardEntity().getPrimaryKey()),
    };
  }

  constructor(props: BoardIDPageProps) {
    super(props);
    this.state = {
      entity:  new BoardEntity(),
      loading: true,
    };
  }

  public async componentDidMount() {
    try {
      this.setState({
        loading: false,
        entity:  await BoardEntity.findOneByID(this.props[BoardIDPageQuery.ID]),
      });
    }
    catch (error) {

    }
  }

  public render() {
    return (
      <div className={Style.Component}>
        <Loader show={!this.state.entity.exists()}>
          <PageHeader title={this.props.id}/>
          <BoardElement entity={this.state.entity}/>
        </Loader>
      </div>
    );
  }


}

export enum BoardIDPageQuery {
  ID = "id",
}

export interface BoardIDPageProps {
  [BoardIDPageQuery.ID]: string
}

interface State {
  entity: BoardEntity

  loading: boolean
}
