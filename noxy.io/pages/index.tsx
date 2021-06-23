import {NextPageContext} from "next";
import React from "react";
import Global from "../Global";
import PageExplorer from "../components/Application/PageExplorer";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends React.Component<PageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

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
