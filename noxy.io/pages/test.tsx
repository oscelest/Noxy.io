import {NextPageContext} from "next";
import React from "react";
import Component from "../components/Application/Component";
import ColorPicker from "../components/Form/ColorPicker";
import Color from "../../common/classes/Color";

// noinspection JSUnusedGlobalSymbols
export default class TestPage extends Component<PageProps, State> {

  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: null};
  }

  constructor(props: {}) {
    super(props);

    this.state = {
      color: new Color("#AAAAAA"),
    };
  }

  public render() {
    return (
      <div style={{flexFlow: "column"}}>
        <ColorPicker value={this.state.color} onChange={this.eventChange}/>
      </div>
    );
  }

  private readonly eventChange = (color: Color) => {
    this.setState({color});
  };
}

interface State {
  color: Color;
}
