import _ from "lodash";
import Moment from "moment";
import React from "react";
import Button from "../../components/Form/Button";
import Input from "../../components/Form/Input";
import ErrorText from "../../components/Text/ErrorText";
import TitleText from "../../components/Text/TitleText";
import Preview from "../../components/UI/Preview";
import FileEntity from "../../entities/FileEntity";
import ButtonType from "../../enums/ButtonType";
import FatalException from "../../exceptions/FatalException";
import Global from "../../Global";
import Helper from "../../Helper";
import Style from "./FileRenameForm.module.scss";

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
    Helper.schedule(this.props.onSubmit, this.parseNames());
  };

  private readonly parseNames = () => {
    const tags = this.state.name.match(/(?<={)([a-z_]+)(?=})/gi);
    return _.map(this.props.file_list, (file, index) => {
      return new FileEntity({
        ...file, name: _.reduce(
          tags,
          (result, value) => {
            switch (value) {
              case "number":
                return result.replace(`{${value}}`, (index + 1).toString());
              case "extension":
                return result.replace(`{${value}}`, file.file_extension.name);
              case "upload_date":
                return result.replace(`{${value}}`, Moment(file.time_created).format("DD-MM-YYYY"));
              default:
                return result;
            }
          },
          this.state.name || file.name),
      });
    });
  };

  private readonly updateSelection = (text: string) => {
    if (!this.state.ref.current) throw new FatalException("Fatal Exception", "Input field has not yet been instantiated.");
    const {start = 0, end = 0} = this.state.ref.current.getSelection() ?? {};
    this.state.ref.current.element?.focus();
    Helper.schedule(this.state.ref.current.setSelection, start + text.length + 2);
    return `${this.state.name.substring(0, start)}{${text}}${this.state.name.substring(end)}`;
  };

  public render() {

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>{this.props.file_list.length > 1 ? `Rename ${this.props.file_list.length} files` : "Rename file"}</TitleText>
        {this.renderError()}
        <Input ref={this.state.ref} label={"Name"} value={this.state.name} onChange={this.eventInputChange}/>
        <div className={Style.Help}>
          <Button className={Style.Button} onClick={this.eventExtensionClick}>Extension</Button>
          <Button className={Style.Button} onClick={this.eventNumberClick}>Number</Button>
          <Button className={Style.Button} onClick={this.eventUploadDateClick}>Upload date</Button>
        </div>
        <TitleText>Rename result</TitleText>
        <div className={Style.ExampleList}>
          {_.map(this.parseNames(), this.renderExample)}
        </div>
        <Button className={Style.Submit} type={ButtonType.SUCCESS} onClick={this.submit}>Rename</Button>
      </div>
    );
  }


  private readonly renderError = () => {
    if (!this.state.error) return;

    return (
      <ErrorText className={Style.Error}>{this.state.error?.message}</ErrorText>
    );
  };


  private readonly renderExample = (file: FileEntity, index: number = 0) => {
    return (
      <div className={Style.Example} key={index}>
        <Preview className={Style.Preview} file={file}/>
        <div className={Style.NameList}>
          <span className={Style.OldName}>{this.props.file_list[index].name}</span>
          <span className={Style.NewName}>{file.name}</span>
        </div>
      </div>
    );
  };

  private readonly eventInputChange = (name: string) => this.setState({name});
  private readonly eventExtensionClick = () => this.setState({name: this.updateSelection("extension")});
  private readonly eventNumberClick = () => this.setState({name: this.updateSelection("number")});
  private readonly eventUploadDateClick = () => this.setState({name: this.updateSelection("upload_date")});
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
