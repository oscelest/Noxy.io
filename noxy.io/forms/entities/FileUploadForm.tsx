import {Canceler} from "axios";
import _ from "lodash";
import React from "react";
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
      loading:        false,
      file_tag_list:  this.props.file_tag_list ?? [],
      file_list:      _.map(this.props.file_list, file => ({file, name: file.name})),
    };
  }

  private readonly getFileIndex = (file: File) => {
    return _.findIndex(this.state.file_list, handle => handle.file === file);
  };

  private readonly updateFileHandle = (index: number, handle: Partial<FileHandle>) => {
    if (index < 0 || index > this.state.file_list.length) return;
    this.setState({file_list: [...this.state.file_list.slice(0, index), {...this.state.file_list[index], ...handle}, ...this.state.file_list.slice(index + 1)]});
  };

  private readonly upload = async (file: File) => {
    const name = this.state.file_list[this.getFileIndex(file)].name;
    if (!name) return this.updateFileHandle(this.getFileIndex(file), {error: new Error("Field cannot be empty")});

    try {
      await FileEntity.create(
        new File([file.slice(0, file.size, file.type)], name, {type: file.type}),
        {file_tag_list: this.state.file_tag_list},
        (event: ProgressEvent) => this.updateFileHandle(this.getFileIndex(file), {progress: +(event.loaded / event.total * 100).toFixed(2)}),
        (cancel: Canceler) => this.updateFileHandle(this.getFileIndex(file), {cancel}),
      );
      this.updateFileHandle(this.getFileIndex(file), {progress: Number.POSITIVE_INFINITY});
    }
    catch (error) {
      this.updateFileHandle(this.getFileIndex(file), {error});
    }
  };

  public render() {
    const {file_list, file_tag_list} = this.state;

    const upload_disabled = !_.some(file_list, handle => handle.progress === undefined);
    const clear_disabled = !file_list.length;
    const label = "Search for available file tags "

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
          <Button className={Style.Action} disabled={clear_disabled} onClick={this.eventFileClear}>Clear All</Button>
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

  private readonly renderFileUpload = ({file, name, progress, error}: FileHandle, key: number = 0) => {
    return (
      <FileUpload key={key} file={file} name={name} progress={progress} error={error} onChange={this.eventFileChange} onUpload={this.upload} onCancel={this.eventFileCancel}/>
    );
  };

  private readonly eventFileTagSearch = async (name: string) => {
    return name ? await FileTagEntity.findMany({name, exclude: this.state.file_tag_list}) : [];
  };

  private readonly eventFileTagChange = (file_tag_list: FileTagEntity[]) => this.setState({file_tag_list});
  private readonly eventFileTagCreate = async (name: string) => await FileTagEntity.create({name});

  private readonly eventFileUploadAll = () => {
    _.map(this.state.file_list, handle => handle.progress === undefined && this.upload(handle.file));
  };

  private readonly eventFileClear = () => {
    _.each(this.state.file_list, handle => handle.cancel?.());
    this.setState({file_list: []});
  };

  private readonly eventBrowseChange = (file_list: FileList) => this.setState({file_list: [...this.state.file_list, ..._.map(file_list, file => ({file, name: file.name}))]});

  private readonly eventFileChange = (name: string, file: File) => this.updateFileHandle(this.getFileIndex(file), {name});
  private readonly eventFileCancel = (file: File) => {
    this.state.file_list[this.getFileIndex(file)].cancel?.();
    this.setState({file_list: _.filter(this.state.file_list, handle => handle.file !== file)});
  };

}

interface FileHandle {
  name: string
  file: File
  error?: Error
  cancel?: Canceler
  progress?: number
}

export interface FileUploadFormProps {
  file_list?: File[]
  file_tag_list?: FileTagEntity[]

  className?: string

  onSubmit?: () => void
}

interface State {
  file_tag_error?: Error
  loading: boolean

  file_list: FileHandle[]
  file_tag_list: FileTagEntity[]
}
