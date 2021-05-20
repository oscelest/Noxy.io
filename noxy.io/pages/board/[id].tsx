import React from "react";
import {NextPageContext} from "next";
import Global from "../../Global";
import Helper from "../../Helper";
import BoardEntity from "../../entities/board/BoardEntity";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import BoardElement from "../../components/Application/BoardElement";
import Style from "./[id].module.scss";
import BoardCardEntity from "../../entities/board/BoardCardEntity";
import BoardLaneEntity from "../../entities/board/BoardLaneEntity";

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
      this.setState({entity: await BoardEntity.findOneByID(this.props[BoardIDPageQuery.ID]), loading: false});
    }
    catch (error) {

    }
  }

  public render() {
    return (
      <div className={Style.Component}>
        <Loader show={!this.state.entity.exists()}>
          <PageHeader title={this.props.id}/>
          <BoardElement entity={this.state.entity}
                        onCardEdit={this.eventCardEdit} onCardRender={this.renderCard} onCardTransform={this.eventCardTransform}
                        onLaneEdit={this.eventLaneEdit}/>
        </Loader>
      </div>
    );
  }

  private readonly renderCard = (card: BoardCardEntity) => {
    return (
      <span className={Style.CardName}>{card.id}</span>
    );
  };

  private readonly eventCardTransform = (entity: BoardCardEntity) => {
    return entity.content
  };

  private readonly eventCardEdit = (entity: BoardCardEntity) => {
    // this.setState({dialog: Dialog.show(<BoardCardEditForm card={entity} onSubmit={this.eventCardEditSubmit}/>)});
  };

  // private readonly eventCardEditSubmit = () => {
  //   this.setState({dialog: Dialog.close(this.state.dialog)});
  // };

  private readonly eventLaneEdit = (entity: BoardLaneEntity) => {

  };

}

export enum BoardIDPageQuery {
  ID = "id",
}

export interface BoardIDPageProps {
  [BoardIDPageQuery.ID]: string
}

interface State {
  entity: BoardEntity

  dialog?: string

  loading: boolean
}
