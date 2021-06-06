import React from "react";
import {NextPageContext} from "next";
import Global from "../../Global";
import Helper from "../../Helper";
import BoardEntity from "../../entities/board/BoardEntity";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import BoardExplorer, {BoardLaneType, BoardCardType} from "../../components/Application/BoardExplorer";
import Style from "./[id].module.scss";
import BoardCardEntity from "../../entities/board/BoardCardEntity";
import BoardType from "../../../common/enums/BoardType";
import Placeholder from "../../components/UI/Placeholder";
import KanbanCardContent from "../../classes/KanbanCardContent";
import Conditional from "../../components/Application/Conditional";
import Dialog from "../../components/Application/Dialog";
import KanbanCardEditForm from "../../forms/kanban/KanbanCardEditForm";

class KanbanLaneContent {
  public test: string;
}

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
      entity:  new BoardEntity() as State["entity"],
      loading: true,
    };
  }

  public async componentDidMount() {
    const next_state = {} as State;
    next_state.loading = false;

    try {
      next_state.entity = await BoardEntity.findOneByID(this.props[BoardIDPageQuery.ID]) as State["entity"];
    }
    catch (error) {
      next_state.placeholder = "Could not load the Kanban board";
    }

    if (next_state.entity.exists() && next_state.entity.type !== BoardType.KANBAN) {
      next_state.placeholder = `The board you're trying to load is not a kanban board but a board of type "${next_state.entity.type}".`;
    }

    this.setState(next_state);
  }

  public render() {
    return (
      <div className={Style.Component}>
        <Loader show={!this.state.entity.exists()}>
          <Placeholder show={!!this.state.placeholder} text={this.state.placeholder}>
            <PageHeader title={this.state.entity.name}/>
            <BoardExplorer className={Style.Board} entity={this.state.entity}
                           onCardTransform={this.eventCardTransform} onCardRender={this.eventCardRender} onCardCreate={this.eventCardCreate} onCardEdit={this.eventCardEdit}/>
          </Placeholder>
        </Loader>
      </div>
    );
  }

  private readonly eventCardCreate = async (board_lane: BoardLaneType<State["entity"]>) => {
    return await BoardCardEntity.createOne({board_lane, content: new KanbanCardContent().toJSON()}) as BoardCardType<State["entity"]>;
  };

  private readonly eventCardRender = (card: BoardCardType<State["entity"]>) => {
    return (
      <div className={Style.Content}>
        <div>{card.content.name}</div>
        <Conditional condition={card.content.description}>
          <div>{card.content.description}</div>
        </Conditional>
        <Conditional condition={card.content.priority && !Number.isNaN(card.content.priority)}>
          <div className={Style.Priority}>
            <div>Priority:</div>
            <div>{card.content.priority}</div>
          </div>
        </Conditional>
      </div>
    );
  };

  private readonly eventCardTransform = (entity: BoardCardType<State["entity"]>) => {
    return new KanbanCardContent(entity.content);
  };

  private readonly eventCardEdit = (entity: BoardCardType<State["entity"]>) => {
    this.setState({dialog: Dialog.show(<KanbanCardEditForm entity={entity} onSubmit={this.eventCardEditSubmit}/>)});
  };

  private readonly eventCardEditSubmit = (new_entity: BoardCardType<State["entity"]>, old_entity: BoardCardType<State["entity"]>) => {
    old_entity.content = new_entity.content;
    this.setState({dialog: Dialog.close(this.state.dialog)});
  };
}


export enum BoardIDPageQuery {
  ID = "id",
}

export interface BoardIDPageProps {
  [BoardIDPageQuery.ID]: string
}

interface State {
  entity: BoardEntity<KanbanCardContent, KanbanLaneContent>

  dialog?: string

  loading: boolean
  placeholder?: string
}