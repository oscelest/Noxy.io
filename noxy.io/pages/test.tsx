import {NextPageContext} from "next";
import React from "react";
import PermissionLevel from "../../common/enums/PermissionLevel";
import Component from "../components/Application/Component";
import List from "../components/Base/List";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends Component<PageProps, State> {
  
  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: PermissionLevel.ADMIN};
  }
  
  constructor(props: {}) {
    super(props);
    
    this.state = {
      index: -1,
    };
  }
  
  public render() {
    return (
      <List index={this.state.index} onCommit={this.eventCommit} onChange={this.eventChange}>
        {[]}
      </List>
    );
  }
  
  
  private readonly eventChange = (index: number, value: string) => {
    this.setState({index: index});
  };
  
  private readonly eventCommit = (index: number) => {
    this.setState({index: index});
  };
}

interface State {
  index: number;
}
