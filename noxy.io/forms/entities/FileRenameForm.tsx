import _ from "lodash";
import React from "react";
import Button from "../../components/Form/Button";
import Input from "../../components/Form/Input";
import ErrorText from "../../components/Text/ErrorText";
import TitleText from "../../components/Text/TitleText";
import FileEntity from "../../entities/FileEntity";
import ButtonType from "../../enums/ButtonType";
import Global from "../../Global";
import Util from "../../Util";
import Style from "./FileSetTagListForm.module.scss";
import Moment from "moment";

export default class FileRenameForm extends React.Component<FileRenameFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: FileRenameFormProps) {
    super(props);

    this.state = {
      ref:  React.createRef(),
      name: "",
    };
  }

  public readonly submit = async () => {
    const tags = this.state.name.match(/(?<={)([a-z_]+)(?=})/gi);
    const files = _.map(this.props.file_list, (file, index) => {
      return new FileEntity({
        ...file, name: _.reduce(
          tags,
          (result, value) => {
            switch (value) {
              case "i":
              case "count":
              case "number":
                return result.replace(`{${value}}`, (index + 1).toString());
              case "e":
              case "ext":
              case "extension":
                return result.replace(`{${value}}`, file.file_extension.name);
              case "d":
              case "date":
              case "upload":
              case "upload_date":
                return result.replace(`{${value}}`, Moment(file.time_created).format("DD-MM-YYYY"));
              default:
                return result;
            }
          },
          this.state.name),
      });
    });

    Util.schedule(this.props.onSubmit, files);
  };

  public render() {

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>{this.props.file_list.length > 1 ? `Rename ${this.props.file_list.length} files` : "Rename file"}</TitleText>
        {this.renderError()}
        <Input ref={this.state.ref} label={"Name"} value={this.state.name} onChange={this.eventInputChange}/>
        <Button type={ButtonType.SUCCESS} onClick={this.submit}>Rename</Button>
      </div>
    );
  }


  private readonly renderError = () => {
    if (!this.state.error) return;

    return (
      <ErrorText className={Style.Error}>{this.state.error?.message}</ErrorText>
    );
  };

  private readonly eventInputChange = (name: string) => {
    this.setState({name});
  };

}

export interface FileRenameFormProps {
  className?: string

  name?: string
  file_list: FileEntity[]

  onSubmit: (file_tag_list: FileEntity[]) => void
}

interface State {
  ref: React.RefObject<Input>
  name: string
  error?: Error
}
