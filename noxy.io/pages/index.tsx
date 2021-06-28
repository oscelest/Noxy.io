import {NextPageContext} from "next";
import React from "react";
import PageExplorer from "../components/Application/PageExplorer";
import Component from "../components/Application/Component";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends Component<PageProps, State> {

  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: null};
  }

  constructor(props: {}) {
    super(props);
  }

  public render() {
    return (
      <PageExplorer/>
    );
  }
}


interface State {

}
