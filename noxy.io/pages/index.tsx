import {NextPageContext} from "next";
import Component from "../components/Application/Component";
import React from "react";
import PageExplorer from "../components/Application/PageExplorer";
import PageEntity from "../entities/Page/PageEntity";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends Component<PageProps, State> {

  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: null};
  }

  constructor(props: {}) {
    super(props);

    this.state = {
      page: new PageEntity(),
    };
  }

  public render() {
    return (
      <PageExplorer entity={this.state.page} onChange={this.eventText}/>
    );
  }

  private readonly eventText = (page: PageEntity) => {
    this.setState({page});
  };
}

interface State {
  page: PageEntity;
}
