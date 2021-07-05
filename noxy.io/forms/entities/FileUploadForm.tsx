import {AxiosError, Canceler} from "axios";
import _ from "lodash";
import React from "react";
import FileTransfer from "../../../common/classes/FileTransfer";
import Dialog from "../../components/Application/Dialog";
import Button from "../../components/Form/Button";
import EntityPicker from "../../components/Form/EntityPicker";
import FilePicker from "../../components/Form/FilePicker";
import FileUpload from "../../components/Form/FileUpload";
import FileEntity from "../../entities/file/FileEntity";
import FileTagEntity from "../../entities/file/FileTagEntity";
import QueuePosition from "../../enums/QueuePosition";
import ConfirmForm from "../ConfirmForm";
import Style from "./FileUploadForm.module.scss";
import Form from "../../components/Base/Form";
import Component from "../../components/Application/Component";

export default class FileUploadForm extends Component<FileUploadFormProps, State> {

  constructor(props: FileUploadFormProps) {
    super(props);

    this.state = {
      tag_search:         "",
      tag_loading:        false,
      tag_available_list: [],
      tag_selected_list:  this.props.file_tag_list ?? [],

      file_list: _.map(this.props.file_list, file => new FileTransfer(file)),
    };
  }

  private readonly upload = async (transfer: FileTransfer) => {
    if (!transfer.name) return transfer.fail("Field cannot be empty");

    try {
      const entity = await FileEntity.postOne(
        new File([transfer.file.slice(0, transfer.file.size, transfer.file.type)], transfer.name, {type: transfer.file.type}),
        {file_tag_list: this.state.tag_selected_list},
        (event: ProgressEvent) => this.advanceFileTransfer(transfer, {error: undefined, progress: +(event.loaded / event.total * 100).toFixed(2)}),
        (cancel: Canceler) => this.advanceFileTransfer(transfer, {canceler: cancel}),
      );
      this.advanceFileTransfer(transfer, {error: undefined, progress: Number.POSITIVE_INFINITY});
      this.props.onFileUpload?.(entity);
    }
    catch (exception) {
      const error = exception as AxiosError<APIRequest<any>>;

      if (error.isAxiosError) {
        if (error.response?.status === 404) {
          if (error.response?.data.content.entity === "FileExtension") {
            return this.failFileTransfer(transfer, `"${error.response.data.content.params.mime_type}" is not supported.`, true);
          }
        }
      }

      this.failFileTransfer(transfer, error);
    }
  };

  private readonly advanceFileTransfer = (transfer: FileTransfer, next: Partial<FileTransfer>) => {
    this.setState({file_list: _.map(this.state.file_list, value => value === transfer ? transfer.advance(next) : value)});
  };

  private readonly failFileTransfer = (transfer: FileTransfer, next: string | Error, fatal = false) => {
    this.setState({file_list: _.map(this.state.file_list, value => value === transfer ? transfer.fail(next, fatal) : value)});
  };

  private readonly closeDialog = () => {
    Dialog.close(this.state.dialog);
  };

  public componentDidUpdate(prevProps: Readonly<FileUploadFormProps>, prevState: Readonly<State>, snapshot?: any): void {
    if (prevProps.file_list !== this.props.file_list) {
      this.setState({file_list: [...this.state.file_list, ..._.map(this.props.file_list, file => new FileTransfer(file))]});
    }
  }

  public render() {
    const {file_list, tag_selected_list, tag_available_list, error} = this.state;
    const upload_disabled = !_.some(file_list, handle => handle.progress === 0);
    const clear_disabled = !file_list.length;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <Form className={classes.join(" ")} error={error}>
        <EntityPicker className={Style.TagList} horizontal={true} selected={tag_selected_list} available={tag_available_list}
                      onRender={FileTagEntity.render} onSearch={this.eventTagSearch} onCreate={this.eventTagCreate} onChange={this.eventTagChange} onDelete={this.openTagDeleteDialog}/>

        <div className={Style.FileList}>
          {_.map(file_list, this.renderFileUpload)}
        </div>

        <div className={Style.ActionList}>
          <Button className={Style.Action} disabled={clear_disabled} onClick={this.eventFileCancelAll}>Cancel All</Button>
          <FilePicker className={Style.Action} multiple={true} onChange={this.eventBrowseChange}>Browse</FilePicker>
          <Button className={Style.Action} disabled={upload_disabled} onClick={this.eventFileUploadAll}>Upload all</Button>
        </div>
      </Form>
    );
  }

  private readonly renderFileUpload = (transfer: FileTransfer, key: number = 0) => {
    return (
      <FileUpload key={key} transfer={transfer} onChange={this.eventFileChange} onUpload={this.upload} onCancel={this.eventFileCancel}/>
    );
  };

  private readonly openTagDeleteDialog = async (tag: FileTagEntity, tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]) => {
    const value = {tag, tag_selected_list, tag_available_list};
    this.setState({
      dialog:
        Dialog.show(
          <ConfirmForm value={value} onAccept={this.eventTagDelete} onDecline={this.closeDialog}/>,
          {position: QueuePosition.FIRST, title: "Permanently delete tag?"},
        ),
    });
  };

  private readonly eventTagDelete = async ({tag, tag_selected_list, tag_available_list}: {tag: FileTagEntity, tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]}) => {
    await FileTagEntity.deleteOne(tag);
    this.setState({tag_selected_list, tag_available_list});
    this.closeDialog();
  };

  private readonly eventTagChange = (tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]) => {
    this.setState({tag_selected_list, tag_available_list});
  };

  private readonly eventTagSearch = async (name: string) => {
    this.setState({tag_available_list: await FileTagEntity.getMany({name, exclude: this.state.tag_selected_list})});
  };

  private readonly eventTagCreate = async (name: string) => {
    const file_tag = await FileTagEntity.createOne({name});
    this.props.onTagCreate?.(file_tag);
    return file_tag;
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
    this.setState({file_list: _.filter(this.state.file_list, handle => !!handle.cancel?.().error)});
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
  dialog?: string
  error?: Error

  file_list: FileTransfer[]

  tag_search: string
  tag_loading: boolean
  tag_selected_list: FileTagEntity[]
  tag_available_list: FileTagEntity[]
}
