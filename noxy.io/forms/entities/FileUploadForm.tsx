import {AxiosError, Canceler} from "axios";
import _ from "lodash";
import React from "react";
import FileTransfer from "../../../common/classes/FileTransfer";
import Button from "../../components/Form/Button";
import EntityMultiSelect from "../../components/Form/EntityMultiSelect";
import FilePicker from "../../components/Form/FilePicker";
import FileUpload from "../../components/Form/FileUpload";
import ErrorText from "../../components/Text/ErrorText";
import TitleText from "../../components/Text/TitleText";
import FileEntity from "../../entities/FileEntity";
import FileTagEntity from "../../entities/FileTagEntity";
import Global from "../../Global";
import Style from "./FileUploadForm.module.scss";

export default class FileUploadForm extends React.Component<FileUploadFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: FileUploadFormProps) {
    super(props);

    this.state = {
      loading:       false,
      file_tag_list: this.props.file_tag_list ?? [],
      file_list:     _.map(this.props.file_list, file => new FileTransfer(file)),
    };
  }

  private readonly advanceFileTransfer = (transfer: FileTransfer, next: Partial<FileTransfer>) => {
    this.setState({file_list: _.map(this.state.file_list, value => value === transfer ? transfer.advance(next) : value)});
  };

  private readonly failFileTransfer = (transfer: FileTransfer, next: string | Error, fatal = false) => {
    this.setState({file_list: _.map(this.state.file_list, value => value === transfer ? transfer.fail(next, fatal) : value)});
  };


  private readonly upload = async (transfer: FileTransfer) => {
    if (!transfer.name) return transfer.fail("Field cannot be empty");

    try {
      const entity = await FileEntity.create(
        new File([transfer.file.slice(0, transfer.file.size, transfer.file.type)], transfer.name, {type: transfer.file.type}),
        {file_tag_list: this.state.file_tag_list},
        (event: ProgressEvent) => this.advanceFileTransfer(transfer, {progress: +(event.loaded / event.total * 100).toFixed(2)}),
        (cancel: Canceler) => this.advanceFileTransfer(transfer, {canceler: cancel}),
      );
      this.advanceFileTransfer(transfer, {progress: Number.POSITIVE_INFINITY});
      this.props.onFileUpload?.(entity);
    }
    catch (exception) {
      const error = exception as AxiosError<APIRequest<{mime_type: string}>>;

      if (error.isAxiosError) {
        if (error.response?.status === 400) {
          if (error.response?.data.content.mime_type) {
            return this.failFileTransfer(transfer, `"${error.response.data.content.mime_type}" is not supported.`, true);
          }
        }
      }

      this.failFileTransfer(transfer, error);
    }
  };

  public render() {
    const {file_list, file_tag_list} = this.state;

    const upload_disabled = !_.some(file_list, handle => handle.progress === 0);
    const clear_disabled = !file_list.length;
    const label = "Search for available file tags ";

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>Upload file(s)</TitleText>

        {this.renderFileTagError()}

        <EntityMultiSelect className={Style.FileTag} label={label} method={this.eventFileTagSearch} property={"name"} onChange={this.eventFileTagChange} onCreate={this.eventFileTagCreate}>
          {file_tag_list}
        </EntityMultiSelect>

        <div className={Style.FileList}>
          {_.map(file_list, this.renderFileUpload)}
        </div>

        <div className={Style.ActionList}>
          <Button className={Style.Action} disabled={clear_disabled} onClick={this.eventFileCancelAll}>Cancel All</Button>
          <FilePicker multiple={true} onChange={this.eventBrowseChange}>Browse</FilePicker>
          <Button className={Style.Action} disabled={upload_disabled} onClick={this.eventFileUploadAll}>Upload all</Button>
        </div>
      </div>
    );
  }

  private readonly renderFileTagError = () => {
    if (!this.state.file_tag_error) return null;

    return (
      <ErrorText>{this.state.file_tag_error.message}</ErrorText>
    );
  };

  private readonly renderFileUpload = (transfer: FileTransfer, key: number = 0) => {
    return (
      <FileUpload key={key} transfer={transfer} onChange={this.eventFileChange} onUpload={this.upload} onCancel={this.eventFileCancel}/>
    );
  };

  private readonly eventFileTagCreate = async (name: string) => {
    const entity = await FileTagEntity.createOne({name});
    this.props.onTagCreate?.(entity);
    return entity;
  };

  private readonly eventBrowseChange = (file_list: FileList) => {
    this.setState({file_list: _.concat(this.state.file_list, _.map(file_list, file => new FileTransfer(file)))});
  };

  private readonly eventFileTagChange = (file_tag_list: FileTagEntity[]) => {
    this.setState({file_tag_list});
  };

  private readonly eventFileTagSearch = async (name: string) => {
    return name ? await FileTagEntity.findMany({name, exclude: this.state.file_tag_list}) : [];
  };

  private readonly eventFileChange = (name: string, transfer: FileTransfer) => {
    this.advanceFileTransfer(transfer, {name});
  };

  private readonly eventFileCancel = (transfer: FileTransfer) => {
    transfer.cancel();
    this.setState({file_list: _.filter(this.state.file_list, value => value !== transfer)});
  };

  private readonly eventFileUploadAll = async () => {
    for (let handle of this.state.file_list) {
      if (!handle.progress) await this.upload(handle);
    }
  };

  private readonly eventFileCancelAll = () => {
    this.setState({file_list: _.filter(this.state.file_list, handle => !!handle.cancel?.())});
  };

}

export interface FileUploadFormProps {
  file_list?: File[]
  file_tag_list?: FileTagEntity[]

  className?: string

  onTagCreate?(tag: FileTagEntity): void
  onFileUpload?(file: FileEntity): void
}

interface State {
  file_tag_error?: Error
  loading: boolean

  file_list: FileTransfer[]
  file_tag_list: FileTagEntity[]
}
