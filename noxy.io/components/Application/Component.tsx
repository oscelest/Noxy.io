import React from "react";
import Util from "../../../common/services/Util";
import Global from "../../Global";

export default class Component<P = {}, S = {}> extends React.Component<P, S> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context = this["context"];

  constructor(props: P) {
    super(props);
  }
  
  public updateState = (delay?: boolean) => {
    return delay ? Util.schedule(() => this.setState({})) : this.setState({});
  }

}
