import React from "react";
import ProgressHandler from "../../../common/classes/ProgressHandler";
import FileTypeName from "../../../common/enums/FileTypeName";
import XHRState from "../../../common/enums/XHRState";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import Preview from "../UI/Preview";
import Button from "./Button";
import Style from "./FileUpload.module.scss";
import Input from "./Input";
import ProgressBar from "./ProgressBar";

export default class FileUpload extends Component<FileUploadProps, State> {

  constructor(props: FileUploadProps) {
    super(props);
    this.state = {
      path: "",
      type: FileTypeName.UNKNOWN,
    };
  }

  private readonly getPath = () => {
    return URL.createObjectURL(this.props.transfer.data);
  };

  private readonly getType = () => {
    return this.props.transfer.data.type.split("/")[0] as FileTypeName;
  };

  private readonly getUploadText = () => {
    if (this.props.transfer.error) return "Retry";
    return "Upload";
  };

  private readonly getCancelText = () => {
    if (this.props.transfer.error) return "Remove";
    if (this.props.transfer.state === XHRState.DONE) return "Clear";
    return "Cancel";
  };

  private readonly getProgressBarText = () => {
    if (this.props.transfer.error) return this.props.transfer.error.message;
    if (this.props.transfer.state === XHRState.UNSENT ||this.props.transfer.state === XHRState.OPENED || this.props.transfer.state === XHRState.HEADERS_RECEIVED) return "Ready";
    if (this.props.transfer.state === XHRState.LOADING) return "Sending...";
    if (this.props.transfer.progress === 100 && this.props.transfer.state !== XHRState.DONE) return "Validating...";
    if (this.props.transfer.state === XHRState.DONE) return "Upload successful";
    return `${this.props.transfer.progress}%`;
  };

  public componentDidMount() {
    this.setState({path: this.getPath(), type: this.getType()});
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
          </Conditional>
          <Conditional condition={!this.props.transfer.progress}>
            <Input label={"Name"} error={this.props.transfer.error} value={this.props.transfer.data.name} onChange={this.eventChange}/>
          </Conditional>
          <div className={Style.FileActionList}>
            <Conditional condition={!this.props.transfer.progress}>
              <Button className={Style.FileAction} onClick={this.eventUpload}>{this.getUploadText()}</Button>
            </Conditional>
            <Button className={Style.FileAction} onClick={this.eventCancel}>{this.getCancelText()}</Button>
          </div>
        </div>
      </div>
    );
  }

  private readonly eventChange = (name: string) => {
    this.props.onChange?.(name, this.props.transfer);
  };

  private readonly eventCancel = () => {
    this.props.onCancel?.(this.props.transfer);
  };

  private readonly eventUpload = () => {
    this.props.onUpload?.(this.props.transfer);
  };

}

export interface FileUploadProps {
  transfer: ProgressHandler<File>

  children?: never
  className?: string

  onChange(name: string, file: ProgressHandler<File>): void
  onUpload?(file: ProgressHandler<File>): void
  onCancel?(file: ProgressHandler<File>): void
}

interface State {
  path: string
  type: FileTypeName
}
