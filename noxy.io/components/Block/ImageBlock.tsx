import React from "react";
import Component from "../Application/Component";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import Style from "./ImageBlock.module.scss";
import Input from "../Form/Input";
import Button from "../Form/Button";
import Dialog from "../Application/Dialog";
import FileExplorer from "../Application/FileExplorer";
import Preview from "../UI/Preview";
import FileTypeName from "../../../common/enums/FileTypeName";

export default class ImageBlock extends Component<ImageBlockProps, State> {

  constructor(props: ImageBlockProps) {
    super(props);
    this.state = {
      file_url: "",
      loading:  false,
    };
  }

  public render() {
    const {readonly = true, block, className} = this.props;
    if (readonly && !block.content.value.length) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <div className={Style.Preview}>
          <Preview path={this.state.file_url} type={FileTypeName.IMAGE}/>
          <div>
            <Button onClick={this.eventOpenDialog}>Upload</Button>
            <Input label={"URL"} value={this.state.file_url} onChange={this.eventFileURLChange}/>
          </div>
        </div>
        {/*<EditText selection={} decoration={} onSelect={} onChange={}/>*/}
      </div>
    );
  }

  private readonly eventOpenDialog = () => {
    const dialog = Dialog.show(<FileExplorer/>);
    this.setState({dialog});
  };

  private readonly eventFileURLChange = (value: string) => {
    this.setState({file_url: value});
  };
}

export interface ImageBlockProps extends PageExplorerBlockProps {

}

interface State {
  dialog?: string;
  loading: boolean;
  file_url: string;
}
