import {AxiosError, Canceler} from "axios";
import _ from "lodash";
import React from "react";
import FileTransfer from "../../../common/classes/FileTransfer";
import Dialog, {DialogListenerType, DialogPriority} from "../../components/Application/Dialog";
import ConfirmDialog from "../../components/Dialog/ConfirmDialog";
import Button from "../../components/Form/Button";
import EntityPicker from "../../components/Form/EntityPicker";
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
      tag_search:         "",
      loading:            false,
      tag_available_list: [],
      tag_selected_list:  this.props.file_tag_list ?? [],

      file_list: _.map(this.props.file_list, file => new FileTransfer(file)),
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
        {file_tag_list: this.state.tag_available_list},
        (event: ProgressEvent) => this.advanceFileTransfer(transfer, {error: undefined, progress: +(event.loaded / event.total * 100).toFixed(2)}),
        (cancel: Canceler) => this.advanceFileTransfer(transfer, {canceler: cancel}),
      );
      this.advanceFileTransfer(transfer, {error: undefined, progress: Number.POSITIVE_INFINITY});
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
    const {file_list, tag_selected_list, tag_available_list} = this.state;

    const upload_disabled = !_.some(file_list, handle => handle.progress === 0);
    const clear_disabled = !file_list.length;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>Upload file(s)</TitleText>

        {this.renderFileTagError()}

        <EntityPicker className={Style.TagList} horizontal={true} selected={tag_selected_list} available={tag_available_list}
                      onSearch={this.eventTagSearch} onCreate={this.eventTagCreate} onChange={this.eventTagChange} onDelete={this.openTagDeleteDialog}/>

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

  private readonly openTagDeleteDialog = async (tag: FileTagEntity) => {
    Dialog.show(DialogListenerType.GLOBAL, DialogPriority.NEXT, <ConfirmDialog title={"Permanently delete tag?"} value={tag} onAccept={this.eventTagDelete}/>);
  };

  private readonly eventTagDelete = async (tag: FileTagEntity) => {
    tag = await FileTagEntity.deleteOne(tag);
    this.setState({
      tag_selected_list:  _.filter(this.state.tag_selected_list, value => value.name !== tag.name),
      tag_available_list: _.filter(this.state.tag_available_list, value => value.name !== tag.name),
    });
  };

  private readonly eventTagChange = (tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]) => {
    this.setState({tag_selected_list, tag_available_list});
  };

  private readonly eventTagSearch = async (name: string) => {
    this.setState({tag_available_list: await FileTagEntity.findMany({name, exclude: this.state.tag_selected_list})});
  };

  private readonly eventTagCreate = async (name: string) => {
    return FileTagEntity.createOne({name});
  };


  private readonly eventBrowseChange = (file_list: FileList) => {
    this.setState({file_list: _.concat(this.state.file_list, _.map(file_list, file => new FileTransfer(file)))});
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
  file_list: FileTransfer[]

  tag_search: string
  loading: boolean
  tag_selected_list: FileTagEntity[]
  tag_available_list: FileTagEntity[]
}
