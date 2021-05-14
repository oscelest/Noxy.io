import _ from "lodash";
import React from "react";
import FileTransfer from "../../../common/classes/FileTransfer";
import FileTypeName from "../../../common/enums/FileTypeName";
import Preview from "../UI/Preview";
import Button from "./Button";
import Style from "./FileUpload.module.scss";
import Input from "./Input";
import ProgressBar from "./ProgressBar";
import Conditional from "../Application/Conditional";

export default class FileUpload extends React.Component<FileUploadProps, State> {

  constructor(props: FileUploadProps) {
    super(props);
    this.state = {
      path: "",
      type: FileTypeName.UNKNOWN,
    };
  }

  private readonly getPath = () => {
    return URL.createObjectURL(this.props.transfer.file);
  };

  private readonly getType = () => {
    return this.props.transfer.file.type.split("/")[0] as FileTypeName;
  };

  private readonly getUploadText = () => {
    if (this.props.transfer.error) return "Retry";
    return "Upload";
  };

  private readonly getCancelText = () => {
    if (this.props.transfer.progress === Number.POSITIVE_INFINITY) return "Clear";
    if (this.props.transfer.progress === Number.NEGATIVE_INFINITY) return "Remove";
    return "Cancel";
  };

  private readonly getProgressBarText = () => {
    if (this.props.transfer.error) return this.props.transfer.error.message;
    if (this.props.transfer.progress === Number.POSITIVE_INFINITY) return "Upload successful";
    if (this.props.transfer.progress === 100) return "Validating...";
    return `${this.props.transfer.progress}%`;
  };

  public componentDidMount() {
    this.setState({path: this.getPath(), type: this.getType()});
  }

  public componentDidUpdate(prevProps: Readonly<FileUploadProps>) {
    const next_state = {} as State;

    if (prevProps.transfer.file !== this.props.transfer.file) {
      next_state.path = this.getPath();
      next_state.type = this.getType();
    }

    if (_.size(next_state)) this.setState(next_state);
  }

  public render() {
    const {path, type} = this.state;
    const {className} = this.props;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <Preview className={Style.FilePreview} path={path} type={type}/>
        <div className={Style.FileInfo}>
          <Conditional condition={this.props.transfer.progress}>
            <ProgressBar progress={this.props.transfer.progress ?? 0}>{this.getProgressBarText()}</ProgressBar>
            <Input label={"Name"} error={this.props.transfer.error} value={this.props.transfer.name} onChange={this.eventNameChange}/>
          </Conditional>
          <div className={Style.FileActionList}>
            <Conditional condition={this.props.transfer.progress}>
              <Button className={Style.FileAction} onClick={this.eventUploadClick}>{this.getUploadText()}</Button>
            </Conditional>
            <Button className={Style.FileAction} onClick={this.eventCancelClick}>{this.getCancelText()}</Button>
          </div>
        </div>
      </div>
    );
  }

  private readonly eventNameChange = (name: string) => {
    this.props.onChange?.(name, this.props.transfer);
  };

  private readonly eventCancelClick = () => {
    this.props.onCancel?.(this.props.transfer);
  };

  private readonly eventUploadClick = () => {
    this.props.onUpload?.(this.props.transfer);
  };

}

export interface FileUploadProps {
  transfer: FileTransfer

  children?: never
  className?: string

  onChange?: (name: string, file: FileTransfer) => void
  onUpload?: (file: FileTransfer) => void
  onCancel?: (file: FileTransfer) => void
}

interface State {
  path: string
  type: FileTypeName
}
