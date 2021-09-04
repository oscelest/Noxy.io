import {NextPageContext} from "next";
import React from "react";
import PermissionLevel from "../../common/enums/PermissionLevel";
import Component from "../components/Application/Component";
import {AutoComplete} from "../components/Base/AutoComplete";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends Component<PageProps, State> {
  
  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: PermissionLevel.ADMIN};
  }
  
  private static values = ["Test", "Hello", "Test!", "Test1!", "Test2!"];
  
  constructor(props: {}) {
    super(props);
    
    this.state = {
      value: "",
      index: -1,
    };
  }
  
  public render() {
    return (
      <div style={{flexFlow: "column", width: "200px"}}>
        <AutoComplete required={true} label={"Test"} value={this.state.value} index={this.state.index}
                      onChange={this.eventChange} onReset={this.eventInputReset}>
          {IndexPage.values}
        </AutoComplete>
      </div>
    );
  }
  
  private readonly eventChange = (index: number, value: string) => {
    console.log("changing in top level", index, value)
    this.setState({index, value});
  };
  
  private readonly eventInputReset = () => {
    this.setState({index: -1});
  };
}

interface State {
  value: string;
  index: number;
}
