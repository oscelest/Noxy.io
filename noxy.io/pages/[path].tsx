import React from "react";
import {NextPageContext} from "next";
import Style from "./[path].module.scss";
import Global from "../Global";
import Helper from "../Helper";
import Entity from "../classes/Entity";
import PageEntity from "../entities/page/PageEntity";
import Loader from "../components/UI/Loader";
import Placeholder from "../components/UI/Placeholder";
import PageHeader from "../components/UI/PageHeader";
import Markdown from "../components/UI/Markdown";

export default class PathPage extends React.Component<PathPageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): PathPageProps {
    return {
      [BoardIDPageQuery.PATH]: Helper.getQueryProp(context.query[BoardIDPageQuery.PATH], Entity.defaultID),
    };
  }

  constructor(props: PathPageProps) {
    super(props);
    this.state = {
      entity:  new PageEntity(),
      loading: true,
    };
  }

  public async componentDidMount() {
    const next_state = {} as State;
    next_state.loading = false;

    try {
      next_state.entity = await PageEntity.findOneByPath(this.props[BoardIDPageQuery.PATH]) as State["entity"];
    }
    catch (error) {
      next_state.placeholder = "Could not load the Kanban board";
    }

    this.setState(next_state);
  }

  public render() {
    return (
      <div className={Style.Component}>
        <Loader show={!this.state.entity.exists()}>
          <Placeholder show={!!this.state.placeholder} text={this.state.placeholder}>
            <PageHeader title={this.state.entity.name}/>
            <Markdown>{this.state.entity.content}</Markdown>
          </Placeholder>
        </Loader>
      </div>
    );
  }

}


export enum BoardIDPageQuery {
  PATH = "path",
}

export interface PathPageProps {
  [BoardIDPageQuery.PATH]: string
}

interface State {
  entity: PageEntity

  dialog?: string

  loading: boolean
  placeholder?: string
}
