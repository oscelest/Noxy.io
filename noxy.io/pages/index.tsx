import React from "react";
import Component from "../components/Application/Component";
import BlockEditor from "../components/Application/BlockEditor/BlockEditor";
import PageEntity from "../entities/Page/PageEntity";
import {v4} from "uuid";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends Component<PageProps, State> {

  public static getInitialProps(): PageProps {
    return {permission: null};
  }

  constructor(props: {}) {
    super(props);

    this.state = {
      page: new PageEntity({id: v4()}),
    };
  }

  public render() {
    return (
      <BlockEditor entity={this.state.page} readonly={false} onChange={this.eventText}/>
    );
  }

  private readonly eventText = (page: PageEntity) => {
    this.setState({page});
  };
}

interface State {
  page: PageEntity;
}
