import {NextPageContext} from "next";
import React from "react";
import Component from "../components/Application/Component";
import BlockEditor from "../components/Application/BlockEditor/BlockEditor";
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
