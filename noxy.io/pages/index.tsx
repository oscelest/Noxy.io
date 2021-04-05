import {NextPageContext} from "next";
import React from "react";
import Button from "../components/Form/Button";
import Input from "../components/Form/Input";
import Tickable from "../components/Form/Tickable";
import HeaderText from "../components/Text/HeaderText";
import FileTypeEntity from "../entities/FileTypeEntity";
import IconType from "../enums/components/IconType";
import InputType from "../enums/components/InputType";
import Global from "../Global";
import Style from "./index.module.scss";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends React.Component<PageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: null};
  }

  constructor(props: {}) {
    super(props);
    this.state = {
      input:    {
        value: "",
      },
      combobox: {
        input: "",
        index: -1,
        list:  ["Typescript", "React", "Next.js", "SCSS", "Node.js"],
      },
    };
  }

  public render() {
    return (
      <div className={Style.Component}>
        <h2>Components</h2>
        <div className={Style.Segment}>
          <HeaderText>Input</HeaderText>
          <p>
            A basic input field with sliding placeholder text to ensure that you always know what to put into the field,
            but without having to figure out where to place the field name text.
          </p>
          <Input className={Style.Input} type={InputType.TEXT} value={this.state.input.value} label={"Input"} onChange={this.eventInputChange}/>
        </div>
        <div className={Style.Segment}>
          <HeaderText>Button</HeaderText>
          <p>Button design</p>
          <Button className={Style.Button}>Button</Button>
          <Button className={Style.Button} icon={IconType.FILTER}/>
          <Button className={Style.Button} icon={IconType.ADD}>Button</Button>
          <Button className={Style.Button} disabled={true}>Button</Button>
        </div>
        <div className={Style.Segment}>
          <HeaderText>Radio Button</HeaderText>
          <p>Radio button design</p>
          <Tickable onChange={() => {}}>
            {{
              1: {text: "Audio", value: new FileTypeEntity({name: "audio"}), disabled: false, checked: true},
              2: {text: "Video", value: new FileTypeEntity({name: "video"}), disabled: false, checked: false},
              3: {text: "Application", value: new FileTypeEntity({name: "application"}), disabled: true, checked: false},
              4: {text: "Image", value: new FileTypeEntity({name: "image"}), disabled: true, checked: true},
            }}
          </Tickable>
        </div>
        <div className={Style.Segment}>
          <HeaderText>Sort Buttons</HeaderText>
          <p>Sort button design</p>
          <Button icon={IconType.COPY}/>
        </div>
      </div>
    );
  }

  private readonly eventInputChange = (value: string) => this.setState({input: {...this.state.input, value}});

}


interface State {
  input: {
    value: string

  }
  combobox: {
    index: number
    input: string
    list: string[]
  }
}
