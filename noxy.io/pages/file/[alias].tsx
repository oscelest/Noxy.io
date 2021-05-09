import {AxiosError} from "axios";
import _ from "lodash";
import {NextPageContext} from "next";
import Router from "next/router";
import PrettyBytes from "pretty-bytes";
import React from "react";
import FileTypeName from "../../../common/enums/FileTypeName";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import Conditional from "../../components/Application/Conditional";
import Dialog, {DialogListenerType, DialogPriority} from "../../components/Application/Dialog";
import ConfirmDialog from "../../components/Dialog/ConfirmDialog";
import ElementDialog from "../../components/Dialog/ElementDialog";
import Button from "../../components/Form/Button";
import Checkbox, {CheckboxCollection} from "../../components/Form/Checkbox";
import EntityPicker from "../../components/Form/EntityPicker";
import Input from "../../components/Form/Input";
import RadioButton, {RadioButtonCollection} from "../../components/Form/RadioButton";
import EllipsisText from "../../components/Text/EllipsisText";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import Placeholder from "../../components/UI/Placeholder";
import FileEntity from "../../entities/FileEntity";
import FileTagEntity from "../../entities/FileTagEntity";
import IconType from "../../enums/IconType";
import Size from "../../enums/Size";
import FatalException from "../../exceptions/FatalException";
import Global from "../../Global";
import Helper from "../../Helper";
import Style from "./[alias].module.scss";

// noinspection JSUnusedGlobalSymbols
export default class FileAliasPage extends React.Component<FileAliasPageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): FileAliasPageProps {
    const alias = (context.query[FileAliasPageQuery.ALIAS] ?? "");

    return {
      [FileAliasPageQuery.ALIAS]: (Array.isArray(alias) ? alias[0] : alias) || "",
    };
  }

  constructor(props: FileAliasPageProps) {
    super(props);
    this.state = {
      ref_dialog: React.createRef(),

      data_loading: true,

      file_loading: true,
      file_privacy: {
        "private": RadioButton.createElement(true, "Private", false, false),
        "link":    RadioButton.createElement(true, "Only with link", false, false),
        "public":  RadioButton.createElement(true, "Public", false, false),
      },

      tag_search:         "",
      tag_loading:        true,
      tag_selected_list:  [],
      tag_available_list: [],
      tag_privacy:        {
        "public": Checkbox.createElement(true, "Public tags", false, false),
      },
    };
  }

  private readonly closeDialog = () => this.state.ref_dialog.current?.close();

  private readonly searchTag = (filter: Partial<State> = {}) => {
    this.setState({tag_loading: true, ...filter} as State);
    this.searchTagInternal();
  };

  private readonly searchTagInternal = _.debounce(
    async () => {
      const next_state = {} as State;

      try {
        next_state.tag_loading = false;
        next_state.tag_available_list = await FileTagEntity.findMany({name: this.state.tag_search, exclude: this.state.tag_selected_list});
      }
      catch (error) {
        console.error(error);
      }
      this.setState(next_state);
    },
    500,
  );

  private readonly createTag = async (name: string) => {
    try {
      return _.find(this.state.tag_selected_list, tag => tag.name.toLowerCase() === name.toLowerCase())
        ?? _.find(this.state.tag_available_list, tag => tag.name.toLowerCase() === name.toLowerCase())
        ?? await FileTagEntity.createOne({name});
    }
    catch (error) {
      if (error?.response?.status === 409) return await FileTagEntity.findOneByName(name);
      throw error;
    }
  };

  public async componentDidMount() {
    if (!this.context.state.user) return this.setState({file_loading: false});

    try {
      const next_state = {} as State;

      next_state.file_loading = false;
      next_state.file = await FileEntity.getByID(this.props[FileAliasPageQuery.ALIAS]);

      if (next_state.file.share_code === null) {
        next_state.file_privacy = {...this.state.file_privacy, private: {...this.state.file_privacy.private, checked: true}} as FilePrivacyRadioButton;
      }
      else if (next_state.file.share_code === "") {
        next_state.file_privacy = {...this.state.file_privacy, public: {...this.state.file_privacy.public, checked: true}} as FilePrivacyRadioButton;
      }
      else {
        next_state.file_privacy = {...this.state.file_privacy, link: {...this.state.file_privacy.link, checked: true}} as FilePrivacyRadioButton;
      }

      this.setState(next_state);

      if (next_state.file.user_created.getPrimaryKey() === this.context.state.user.getPrimaryKey()) {
        next_state.tag_loading = false;
        next_state.tag_available_list = await FileTagEntity.findMany({name: this.state.tag_search, exclude: next_state.file.file_tag_list});
      }

      if (next_state.file.user_created.getPrimaryKey() === this.context.state.user.getPrimaryKey() || next_state.file.flag_public_tag) {
        next_state.tag_selected_list = next_state.file.file_tag_list;
      }

      switch (next_state.file.getFileType()) {
        case FileTypeName.TEXT:
          return this.setState({...next_state, data_loading: false, data: await FileEntity.getDataByID(next_state.file.id)});
        case FileTypeName.AUDIO:
        case FileTypeName.VIDEO:
          return this.setState({...next_state, data_loading: false, data: next_state.file.getDataPath()});
        default:
          return this.setState(next_state);
      }
    }
    catch (error) {
      const exception = error as AxiosError;
      if (exception.response?.status === 404) return this.setState({tag_loading: false, file_loading: false, data_loading: false})
      throw new FatalException("Unexpected error occurred", "A server error has caused this file to be unable to load. Please try again later. This error has already been reported.");
    }
  }

  public render() {
    const {file, file_element, file_loading, file_privacy} = this.state;
    const {tag_search, tag_loading, tag_privacy, tag_selected_list, tag_available_list} = this.state;
    const loading_sidebar = _.includes([FileTypeName.AUDIO, FileTypeName.IMAGE, FileTypeName.VIDEO], file?.getFileType()) && !file_element;

    return (
      <Loader size={Size.LARGE} show={file_loading}>
        <div className={Style.Component}>
          <Placeholder show={!file?.exists()} text={"File does not exist or you do not have permission to view it."}>
            <PageHeader title={file?.name ?? "Loading..."}/>
            <div className={Style.Content}>
              <div className={Style.Viewer} data-file-type={this.state.file?.getFileType()}>
                {this.renderFile()}
              </div>
              <div className={Style.Sidebar}>
                <Loader size={Size.NORMAL} show={loading_sidebar}>

                  <div className={Style.Info}>
                    <span className={Style.Header}>File size</span>
                    <EllipsisText className={Style.Body}>{PrettyBytes(file?.size ?? 0)}</EllipsisText>
                  </div>

                  <div className={Style.Info}>
                    <span className={Style.Header}>File type</span>
                    <EllipsisText className={Style.Body}>{file?.file_extension.mime_type ?? ""}</EllipsisText>
                  </div>

                  <Conditional condition={file?.file_extension.file_type.name === FileTypeName.AUDIO && file_element}>
                    <div className={Style.Info}>
                      <span className={Style.Header}>Audio Length</span>
                      <EllipsisText className={Style.Body}>{Helper.getDuration((file_element as HTMLAudioElement)?.duration)}</EllipsisText>
                    </div>
                  </Conditional>

                  <Conditional condition={file?.file_extension.file_type.name === FileTypeName.IMAGE && file_element}>
                    <div className={Style.Info}>
                      <span className={Style.Header}>Image dimensions</span>
                      <EllipsisText className={Style.Body}>{`${(file_element as HTMLImageElement)?.naturalWidth}px 🞩 ${(file_element as HTMLImageElement)?.naturalHeight}px`}</EllipsisText>
                    </div>
                  </Conditional>

                  <Conditional condition={file?.file_extension.file_type.name === FileTypeName.VIDEO && file_element}>
                    <div className={Style.Info}>
                      <span className={Style.Header}>Video dimensions</span>
                      <EllipsisText className={Style.Body}>{`${(file_element as HTMLVideoElement)?.videoWidth}px 🞩 ${(file_element as HTMLVideoElement)?.videoHeight}px`}</EllipsisText>
                    </div>
                    <div className={Style.Info}>
                      <span className={Style.Header}>Video Length</span>
                      <EllipsisText className={Style.Body}>{Helper.getDuration((file_element as HTMLVideoElement)?.duration)}</EllipsisText>
                    </div>
                  </Conditional>

                  <Conditional condition={file && this.context.state.user?.getPrimaryKey() === file?.user_created.getPrimaryKey()}>
                    <RadioButton className={Style.Privacy} onChange={this.eventFilePrivacyChange}>
                      {file_privacy}
                    </RadioButton>
                    <Checkbox className={Style.Privacy} onChange={this.eventTagPrivacyChange}>
                      {tag_privacy}
                    </Checkbox>
                  </Conditional>

                  <Button>Download file</Button>
                  <Conditional condition={file?.user_created.getPrimaryKey() === this.context.state.user?.getPrimaryKey()}>
                    <Button onClick={this.openDeleteFileDialog}>Delete file</Button>
                  </Conditional>

                  <Conditional condition={true}>
                    <div className={Style.TagSearch}>
                      <Input className={Style.Input} label={"Search for tags"} value={tag_search} onChange={this.eventTagSearchChange}/>
                      <Conditional condition={this.context.hasPermission(PermissionLevel.FILE_TAG_CREATE)}>
                        <Button className={Style.Button} icon={IconType.UI_ADD} value={tag_search} disabled={tag_search.length < 3} onClick={this.eventTagCreateClick}/>
                      </Conditional>
                    </div>
                    <EntityPicker loading={tag_loading} selected={tag_selected_list} available={tag_available_list} onChange={this.eventTagChange} onDelete={this.openDeleteTagDialog}/>
                  </Conditional>

                </Loader>
              </div>
            </div>
          </Placeholder>
        </div>
      </Loader>
    );
  }

  private readonly renderFile = () => {
    if (!this.state.file) return null;

    switch (this.state.file.getFileType()) {
      case FileTypeName.IMAGE:
        return <img className={Style.Image} src={this.state.file.getDataPath()} alt={""} onLoad={this.eventLoad}/>;
      case FileTypeName.TEXT:
        return <textarea className={Style.Textarea} value={this.state.data} readOnly={true}/>;
      case FileTypeName.AUDIO:
        return <audio controls={true} src={this.state.data} onLoadedMetadata={this.eventLoad}/>;
      case FileTypeName.VIDEO:
        return <video controls={true} src={this.state.data} onLoadedMetadata={this.eventLoad}/>;
      default:
        return <div>File cannot be previewed</div>;
    }
  };

  private readonly openDeleteTagDialog = async (tag: FileTagEntity) => {
    Dialog.show(DialogListenerType.GLOBAL, DialogPriority.NEXT, <ConfirmDialog title={"Permanently delete tag?"} value={tag} onAccept={this.eventTagDelete}/>);
  };

  private readonly openDeleteFileDialog = async () => {
    Dialog.show(DialogListenerType.GLOBAL, DialogPriority.NEXT, <ConfirmDialog title={"Permanently delete file?"} value={this.props[FileAliasPageQuery.ALIAS]} onAccept={this.eventFileDelete}/>);
  };

  private readonly eventLoad = (event: React.SyntheticEvent<HTMLElement>) => this.setState({data_loading: false, file_element: event.currentTarget});
  private readonly eventTagSearchChange = (tag_search: string) => this.searchTag({tag_search});

  private readonly eventTagCreateClick = async (name: string) => {
    if (!this.state.file) throw new FatalException("Could not create tag", "The file you're trying to create a new tag for could not be loaded or updated. Please reload the page and try again.");
    const file_tag = await this.createTag(name);

    const tag_selected_list = _.uniqBy([...this.state.tag_selected_list, file_tag], tag => tag.name);
    const tag_available_list = _.filter(this.state.tag_available_list, tag => tag.name !== file_tag.name);

    const file = await FileEntity.updateOne(this.state.file, {...this.state.file, file_tag_list: tag_selected_list});
    this.setState({file, tag_selected_list, tag_available_list, tag_search: ""});
  };

  private readonly eventFileDelete = async (alias: string) => {
    await FileEntity.deleteOne(this.props[FileAliasPageQuery.ALIAS]);
    this.closeDialog();
    return Router.push(`${location.origin}/file`);
  };

  private readonly eventTagDelete = async (tag: FileTagEntity) => {
    if (!this.state.file) throw new FatalException("Could not delete tag", "The file you're trying to delete a new tag from could not be loaded or updated. Please reload the page and try again.");

    tag = await FileTagEntity.deleteOne(tag);
    this.state.file.file_tag_list = _.filter(this.state.tag_selected_list, value => value.getPrimaryKey() !== tag.getPrimaryKey());
    this.setState({
      file:               this.state.file,
      tag_selected_list:  this.state.file.file_tag_list,
      tag_available_list: _.filter(this.state.tag_available_list, value => value.getPrimaryKey() !== tag.getPrimaryKey()),
    });

    this.closeDialog();
  };

  private readonly eventTagChange = async (tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]) => {
    if (!this.state.file) {
      throw new FatalException("Could not manage tags", "The system encountered an unexpected error while managing the tags for this file. Please reload the page and try again.");
    }

    this.setState({tag_selected_list, tag_available_list});
    return FileEntity.updateOne(this.state.file, {...this.state.file, file_tag_list: tag_selected_list});
  };


  private readonly eventFilePrivacyChange = async (file_privacy: FilePrivacyRadioButton) => {
    if (!this.state.file) {
      throw new FatalException("Could not manage file privacy", "The system encountered an unexpected error while managing the privacy settings for this file. Please reload the page and try again.");
    }

    this.setState({file_privacy});
    if (file_privacy.private.checked) {
      this.state.file.share_code = null;
    }
    else if (file_privacy.public.checked) {
      this.state.file.share_code = "";
    }
    else {
      this.state.file.share_code = this.state.file.id;
    }

    const file = await FileEntity.updateOne(this.props[FileAliasPageQuery.ALIAS], this.state.file);
    this.setState({file});

    if (file_privacy.link.checked) {
      await Router.push({pathname: location.origin + location.pathname, query: {share: file.share_code}});
    }
    else {
      await Router.push({pathname: location.origin + location.pathname});
    }
  };


  private readonly eventTagPrivacyChange = async (tag_privacy: TagPrivacyCheckbox) => {
    this.setState({tag_privacy});
  };

}

enum FileAliasPageQuery {
  ALIAS = "alias",
}

type TagPrivacyCheckbox = CheckboxCollection<{public: boolean}>
type FilePrivacyRadioButton = RadioButtonCollection<"private" | "link" | "public", boolean>

interface FileAliasPageProps extends PageProps {
  [FileAliasPageQuery.ALIAS]: string
}

interface State {
  ref_dialog: React.RefObject<ElementDialog>

  data?: any
  data_loading: boolean

  file?: FileEntity
  file_element?: HTMLElement
  file_loading: boolean
  file_privacy: FilePrivacyRadioButton

  tag_search: string
  tag_loading: boolean
  tag_selected_list: FileTagEntity[]
  tag_available_list: FileTagEntity[]
  tag_privacy: TagPrivacyCheckbox
}
