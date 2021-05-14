import {AxiosError} from "axios";
import _ from "lodash";
import {NextPageContext} from "next";
import Router from "next/router";
import PrettyBytes from "pretty-bytes";
import React from "react";
import FileTypeName from "../../../common/enums/FileTypeName";
import Privacy from "../../../common/enums/Privacy";
import Conditional from "../../components/Application/Conditional";
import Dialog from "../../components/Application/Dialog";
import Button from "../../components/Form/Button";
import Checkbox, {CheckboxCollection} from "../../components/Form/Checkbox";
import EntityPicker from "../../components/Form/EntityPicker";
import RadioButton, {RadioButtonCollection} from "../../components/Form/RadioButton";
import EllipsisText from "../../components/Text/EllipsisText";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import Placeholder from "../../components/UI/Placeholder";
import FileEntity from "../../entities/FileEntity";
import FileTagEntity from "../../entities/FileTagEntity";
import QueuePosition from "../../enums/QueuePosition";
import Size from "../../enums/Size";
import FatalException from "../../exceptions/FatalException";
import ConfirmForm from "../../forms/ConfirmForm";
import Global from "../../Global";
import Helper from "../../Helper";
import Style from "./[id].module.scss";

// noinspection JSUnusedGlobalSymbols
export default class FileAliasPage extends React.Component<FileAliasPageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): FileAliasPageProps {
    const alias = (context.query[FileAliasPageQuery.ID] ?? "");
    const share_hash = (context.query[FileAliasPageQuery.SHARE_HASH] ?? "");

    return {
      [FileAliasPageQuery.ID]:         (Array.isArray(alias) ? alias[0] : alias) || "",
      [FileAliasPageQuery.SHARE_HASH]: (Array.isArray(share_hash) ? share_hash[0] : share_hash) || "",
    };
  }

  constructor(props: FileAliasPageProps) {
    super(props);
    this.state = {
      data_loading: true,

      file_loading: true,
      file_privacy: {
        "private": RadioButton.createElement(Privacy.PRIVATE, "Private", false, false),
        "link":    RadioButton.createElement(Privacy.LINK, "Only with link", false, false),
        "public":  RadioButton.createElement(Privacy.PUBLIC, "Public", false, false),
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

  private readonly closeDialog = () => {
    Dialog.close(this.state.dialog);
  };

  public async componentDidMount() {
    if (!this.context.state.user) return this.setState({file_loading: false});

    try {
      const next_state = {} as State;

      next_state.file_loading = false;
      next_state.file = await FileEntity.getByID(this.props[FileAliasPageQuery.ID]);

      if (next_state.file.privacy === Privacy.PRIVATE) {
        next_state.file_privacy = {...this.state.file_privacy, private: {...this.state.file_privacy.private, checked: true}} as FilePrivacyRadioButton;
      }
      else if (next_state.file.share_hash === "") {
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
          return this.setState({...next_state, data_loading: false, data: await FileEntity.getByDataHash(next_state.file.data_hash)});
        case FileTypeName.AUDIO:
        case FileTypeName.VIDEO:
          return this.setState({...next_state, data_loading: false, data: next_state.file.getDataPath()});
        default:
          return this.setState(next_state);
      }
    }
    catch (error) {
      const exception = error as AxiosError;
      this.setState({tag_loading: false, file_loading: false, data_loading: false});
      if (exception.response?.status === 404) return;
      throw new FatalException("Unexpected error occurred", "A server error has caused this file to be unable to load. Please try again later. This error has already been reported.");
    }
  }

  public render() {
    const {file, file_element, file_loading, file_privacy} = this.state;
    const {tag_privacy, tag_selected_list, tag_available_list} = this.state;
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

                  <Button onClick={this.eventDownload}>Download file</Button>
                  <Conditional condition={file?.user_created.getPrimaryKey() === this.context.state.user?.getPrimaryKey()}>
                    <Button onClick={this.openDeleteFileDialog}>Delete file</Button>
                  </Conditional>

                  <Conditional condition={true}>
                    <EntityPicker selected={tag_selected_list} available={tag_available_list}
                                  onSearch={this.eventTagSearch} onCreate={this.eventTagCreate} onChange={this.eventTagChange} onDelete={this.openDeleteTagDialog}/>
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
    this.setState({
      dialog: Dialog.show(
        <ConfirmForm value={tag} onAccept={this.eventTagDelete} onDecline={this.closeDialog}/>,
        {position: QueuePosition.FIRST, title: "Permanently delete tag?"},
      ),
    });
  };

  private readonly eventTagDelete = async (tag: FileTagEntity) => {
    if (!this.state.file) throw new FatalException("Could not delete tag", "The file you're trying to delete a new tag from could not be loaded or updated. Please reload the page and try again.");

    this.closeDialog();
    tag = await FileTagEntity.deleteOne(tag);
    this.state.file.file_tag_list = _.filter(this.state.tag_selected_list, value => value.getPrimaryKey() !== tag.getPrimaryKey());
    this.setState({
      dialog:             undefined,
      file:               this.state.file,
      tag_selected_list:  this.state.file.file_tag_list,
      tag_available_list: _.filter(this.state.tag_available_list, value => value.getPrimaryKey() !== tag.getPrimaryKey()),
    });
  };

  private readonly openDeleteFileDialog = async () => {
    this.setState({
      dialog: Dialog.show(
        <ConfirmForm value={this.props[FileAliasPageQuery.ID]} onAccept={this.eventFileDelete} onDecline={this.closeDialog}/>,
        {position: QueuePosition.NEXT, title: "Permanently delete file?"},
      ),
    });
  };

  private readonly eventFileDelete = async (alias: string) => {
    await FileEntity.deleteOne(alias);
    Dialog.close(this.state.dialog);
    return Router.push(`${location.origin}/file`);
  };

  private readonly eventLoad = (event: React.SyntheticEvent<HTMLElement>) => {
    this.setState({data_loading: false, file_element: event.currentTarget});
  };

  private readonly eventTagChange = async (tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]) => {
    if (!this.state.file) {
      throw new FatalException("Could not manage tags", "The system encountered an unexpected error while managing the tags for this file. Please reload the page and try again.");
    }

    this.setState({tag_selected_list, tag_available_list});
    return FileEntity.updateOne(this.state.file, {...this.state.file, file_tag_list: tag_selected_list});
  };

  private readonly eventTagSearch = async (name: string) => {
    this.setState({tag_available_list: await FileTagEntity.findMany({name, exclude: this.state.tag_selected_list})});
  };

  private readonly eventTagCreate = async (name: string) => {
    return FileTagEntity.createOne({name});
  };

  private readonly eventFilePrivacyChange = async (file_privacy: FilePrivacyRadioButton) => {
    if (!this.state.file) {
      throw new FatalException("Could not manage file privacy", "The system encountered an unexpected error while managing the privacy settings for this file. Please reload the page and try again.");
    }

    this.setState({file_privacy});
    this.state.file.privacy = _.find(file_privacy, item => !!item.checked)?.value ?? this.state.file.privacy;

    const file = await FileEntity.updateOne(this.props[FileAliasPageQuery.ID], this.state.file);
    this.setState({file});

    if (file_privacy.link.checked) {
      await Router.replace({pathname: location.origin + location.pathname, query: {share: file.share_hash}});
    }
    else {
      await Router.replace({pathname: location.origin + location.pathname});
    }
  };

  private readonly eventTagPrivacyChange = async (tag_privacy: TagPrivacyCheckbox) => {
    this.setState({tag_privacy});
  };

  private readonly eventDownload = async () => {
    await FileEntity.confirmDownload(await FileEntity.requestDownload(this.props[FileAliasPageQuery.ID]));
  };

}

export enum FileAliasPageQuery {
  ID = "id",
  SHARE_HASH = "share",
}

type TagPrivacyCheckbox = CheckboxCollection<{public: boolean}>
type FilePrivacyRadioButton = RadioButtonCollection<"private" | "link" | "public", Privacy>

interface FileAliasPageProps extends PageProps {
  [FileAliasPageQuery.ID]: string
  [FileAliasPageQuery.SHARE_HASH]: string
}

interface State {
  dialog?: string

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
