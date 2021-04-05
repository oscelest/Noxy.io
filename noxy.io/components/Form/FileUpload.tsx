import _ from "lodash";
import React from "react";
import Preview from "../UI/Preview";
import Button from "./Button";
import Style from "./FileUpload.module.scss";
import Input from "./Input";
import ProgressBar from "./ProgressBar";

export default class FileUpload extends React.Component<FileUploadProps, State> {

  constructor(props: FileUploadProps) {
    super(props);
    this.state = {
      path: "",
      type: "",
    };
  }

  private readonly getPath = () => {
    return URL.createObjectURL(this.props.file);
  };

  private readonly getType = () => {
    return this.props.file.type.split("/")[0];
  };

  private readonly getUploadText = () => {
    if (this.props.error) return "Retry";
    return "Upload";
  };

  private readonly getCancelText = () => {
    if (this.props.progress === Number.POSITIVE_INFINITY) return "Clear";
    return "Cancel";
  };

  private readonly getProgressBarText = () => {
    if (this.props.error) return this.props.error.message;
    if (this.props.progress === Number.POSITIVE_INFINITY) return "Upload successful";
    if (this.props.progress === 100) return "Validating...";
    return `${this.props.progress}%`;
  };

  public componentDidMount() {
    this.setState({path: this.getPath(), type: this.getType()});
  }

  public componentDidUpdate(prevProps: Readonly<FileUploadProps>) {
    const next_state = {} as State;

    if (prevProps.file !== this.props.file) {
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
          {this.renderProgressBar()}
          {this.renderInput()}
          <div className={Style.FileActionList}>
            {this.renderActionUpload()}
            <Button className={Style.FileAction} onClick={this.eventCancelClick}>{this.getCancelText()}</Button>
          </div>
        </div>
      </div>
    );
  }

  private readonly eventCancelClick = () => this.props.onCancel?.(this.props.file);


  private readonly renderInput = () => {
    if (this.props.progress) return null;

    return (
      <Input label={"Name"} error={this.props.error} value={this.props.name} onChange={this.eventNameChange}/>
    );
  };

  private readonly eventNameChange = (name: string) => this.props.onChange?.(name, this.props.file);

  private readonly renderProgressBar = () => {
    if (!this.props.progress) return null;

    return (
      <ProgressBar progress={this.props.progress ?? 0}>{this.getProgressBarText()}</ProgressBar>
    );
  };


  private readonly renderActionUpload = () => {
    if (!this.props.error && this.props.progress) return;

    return (
      <Button className={Style.FileAction} onClick={this.eventUploadClick}>{this.getUploadText()}</Button>
    )
  }

  private readonly eventUploadClick = () => this.props.onUpload?.(this.props.file);

}

export interface FileUploadProps {
  name: string
  file: File
  error?: Error
  progress?: number

  children?: never
  className?: string

  onChange?: (name: string, file: File) => void
  onUpload?: (file: File) => void
  onCancel?: (file: File) => void
}

interface State {
  path: string
  type: string
}
