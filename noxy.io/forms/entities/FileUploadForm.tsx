import _ from "lodash";
import React from "react";
import ProgressHandler from "../../../common/classes/ProgressHandler";
import QueuePosition from "../../../common/enums/QueuePosition";
import XHRState from "../../../common/enums/XHRState";
import ServerException from "../../../common/exceptions/ServerException";
import Component from "../../components/Application/Component";
import Dialog from "../../components/Application/Dialog";
import Form from "../../components/Base/Form";
import Button from "../../components/Form/Button";
import EntityPicker from "../../components/Form/EntityPicker";
import FilePicker from "../../components/Form/FilePicker";
import FileUpload from "../../components/Form/FileUpload";
import FileEntity from "../../entities/File/FileEntity";
import FileTagEntity from "../../entities/File/FileTagEntity";
import ConfirmForm from "../ConfirmForm";
import Style from "./FileUploadForm.module.scss";

export default class FileUploadForm extends Component<FileUploadFormProps, State> {
  
  constructor(props: FileUploadFormProps) {
    super(props);
    
    const {file_tag_list = [], file_list = []} = this.props;
    this.state = {
      tag_search:         "",
      tag_loading:        false,
      tag_available_list: [],
      tag_selected_list:  file_tag_list,
      file_list:          [...file_list].map(file => new ProgressHandler<File>(file, this.eventFileProgress)),
    };
  }
  
  private getIndex(handler: ProgressHandler<File>) {
    const index = this.state.file_list.findIndex(value => handler.id === value.id);
    if (index < 0) throw new Error("Could not find progress handler in list of progress handlers.");
    return index;
  }
  
  private async upload(transfer: ProgressHandler<File>) {
    if (!transfer.data.name) return transfer.fail(new ServerException(400, {}, "Name missing"));
    
    try {
      const entity = await FileEntity.postOne(transfer.data, {file_tag_list: this.state.tag_selected_list}, transfer);
      this.props.onFileUpload?.(entity);
    }
    catch (exception) {
      const {code, content} = exception as ServerException;
      if (code === 404 && content.entity === "FileExtension") {
        this.state.file_list[this.getIndex(transfer)].error = new ServerException(404, content.entity, `"${content.params.mime_type}" is not supported.`);
      }
    }
    this.setState({file_list: this.state.file_list});
  };
  
  private openTagDeleteDialog(tag: FileTagEntity, tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]) {
    const value = {tag, tag_selected_list, tag_available_list};
    this.setState({
      dialog:
        Dialog.show(
          <ConfirmForm value={value} onAccept={this.eventTagDelete} onDecline={this.closeDialog}/>,
          {position: QueuePosition.FIRST, title: "Permanently delete tag?"},
        ),
    });
  };
  
  private closeDialog() {
    Dialog.close(this.state.dialog);
  };
  
  private appendFileList(file_list: File[] | FileList) {
    this.state.file_list.push(...[...file_list].map(value => new ProgressHandler(value, this.eventFileProgress)));
    this.setState({file_list: this.state.file_list});
  };
  
  public componentDidUpdate(prevProps: Readonly<FileUploadFormProps>, prevState: Readonly<State>, snapshot?: any) {
    if (this.props.file_list && prevProps.file_list !== this.props.file_list) {
      this.appendFileList(this.props.file_list);
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
          <Button className={Style.Action} disabled={clear_disabled} onClick={this.eventCancelAll}>Cancel All</Button>
          <FilePicker className={Style.Action} multiple={true} onChange={this.eventFileListChange}>Browse</FilePicker>
          <Button className={Style.Action} disabled={upload_disabled} onClick={this.eventUploadAll}>Upload all</Button>
        </div>
      </Form>
    );
  }
  
  private readonly renderFileUpload = (transfer: ProgressHandler<File>, key: number = 0) => {
    return (
      <FileUpload key={key} transfer={transfer} onChange={this.eventFileChange} onUpload={this.eventFileUpload}/>
    );
  };
  
  private readonly eventTagSearch = async (name: string) => {
    this.setState({tag_available_list: await FileTagEntity.getMany({name, exclude: this.state.tag_selected_list})});
  };
  
  private readonly eventTagChange = (tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]) => {
    this.setState({tag_selected_list, tag_available_list});
  };
  
  private readonly eventTagCreate = async (name: string) => {
    const file_tag = await FileTagEntity.createOne({name});
    this.props.onTagCreate?.(file_tag);
    return file_tag;
  };
  
  private readonly eventTagDelete = async ({tag, tag_selected_list, tag_available_list}: {tag: FileTagEntity, tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]}) => {
    await FileTagEntity.deleteOne(tag);
    this.setState({tag_selected_list, tag_available_list});
    this.closeDialog();
  };
  
  private readonly eventUploadAll = () => {
    const promise_list = [];
    for (let i = 0; i < this.state.file_list.length; i++) {
      const file = this.state.file_list.at(i);
      if (file?.state === XHRState.UNSENT) promise_list.push(this.upload(file));
    }
    return Promise.all(promise_list);
  };
  
  private readonly eventCancelAll = () => {
    for (let i = 0; i < this.state.file_list.length; i++) {
      const file = this.state.file_list.at(i);
      if (file && file.state !== XHRState.UNSENT && file.state !== XHRState.DONE) file.cancel();
    }
  };
  
  private readonly eventFileUpload = (handler: ProgressHandler<File>) => {
    return this.upload(handler);
  }
  
  private readonly eventFileProgress = (handler: ProgressHandler<File>) => {
    this.state.file_list[this.getIndex(handler)] = handler;
    this.setState({file_list: this.state.file_list});
  };
  
  private readonly eventFileChange = (name: string, transfer: ProgressHandler<File>) => {
    this.state.file_list[this.getIndex(transfer)].data = new File([transfer.data.slice(0, transfer.data.size, transfer.data.type)], name);
    this.setState({file_list: this.state.file_list});
  };
  
  private readonly eventFileListChange = (file_list: File[] | FileList) => {
    this.state.file_list.push(...[...file_list].map(value => new ProgressHandler(value, this.eventFileProgress)));
    this.setState({file_list: this.state.file_list});
  };
}

export interface FileUploadFormProps {
  file_list?: File[] | FileList;
  file_tag_list?: FileTagEntity[];
  
  className?: string;
  
  onTagCreate?(tag: FileTagEntity): void;
  onFileUpload?(file: FileEntity): void;
}

interface State {
  dialog?: string;
  error?: Error;
  
  file_list: ProgressHandler<File>[];
  
  tag_search: string;
  tag_loading: boolean;
  tag_selected_list: FileTagEntity[];
  tag_available_list: FileTagEntity[];
}
