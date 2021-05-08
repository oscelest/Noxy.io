import {NextPageContext} from "next";
import PrettyBytes from "pretty-bytes";
import React from "react";
import FileTypeName from "../../../common/enums/FileTypeName";
import EllipsisText from "../../components/Text/EllipsisText";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import Placeholder from "../../components/UI/Placeholder";
import FileEntity from "../../entities/FileEntity";
import Size from "../../enums/Size";
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
      loading_file: true,
      loading_data: true,
    };
  }

  public async componentDidMount() {
    if (!this.context.state.user) return this.setState({loading_file: false});

    const next_state = {} as State;
    next_state.loading_file = false;
    next_state.entity = await FileEntity.getByID(this.props[FileAliasPageQuery.ALIAS]);
    this.setState(next_state);

    switch (next_state.entity.getFileType()) {
      case FileTypeName.TEXT:
        return this.setState({loading_data: false, data: await FileEntity.getDataByID(next_state.entity.id)});
      case FileTypeName.AUDIO:
      case FileTypeName.VIDEO:
        return this.setState({loading_data: false, data: next_state.entity.getDataPath()});
    }
  }

  public render() {
    return (
      <Loader size={Size.LARGE} show={this.state.loading_file}>
        <div className={Style.Component}>
          <Placeholder show={!this.state.entity?.exists()} text={"File does not exist or you do not have permission to view it."}>
            <PageHeader title={this.state.entity?.name ?? "Loading..."}/>
            <div className={Style.Content}>
              <div className={Style.Viewer} data-file-type={this.state.entity?.getFileType()}>
                {this.renderFile()}
              </div>
              <div className={Style.Sidebar}>
                {this.renderDetails()}
              </div>
            </div>
          </Placeholder>
        </div>
      </Loader>
    );
  }

  private readonly renderFile = () => {
    if (!this.state.entity) return null;

    switch (this.state.entity.getFileType()) {
      case FileTypeName.IMAGE:
        return (
          <img className={Style.Image} src={this.state.entity.getDataPath()} alt={""} onLoad={this.eventLoad}/>
        );
      case FileTypeName.TEXT:
        return (
          <textarea className={Style.Textarea} value={this.state.data} readOnly={true} onLoad={this.eventLoad}/>
        );
      case FileTypeName.AUDIO:
        return (
          <audio controls={true} src={this.state.data} onLoadedMetadata={this.eventLoad}/>
        );
      case FileTypeName.VIDEO:
        return (
          <video controls={true} src={this.state.data} onLoadedMetadata={this.eventLoad}/>
        );
      default:
        return (
          <div>File cannot be previewed</div>
        );
    }
  };

  private readonly renderDetails = () => {
    if (!this.state.entity) return null;

    return (
      <Loader size={Size.NORMAL} show={!this.state.element}>
        <div className={Style.Info}>
          <span className={Style.Header}>File size</span>
          <EllipsisText className={Style.Body}>{PrettyBytes(this.state.entity?.size ?? 0)}</EllipsisText>
        </div>
        <div className={Style.Info}>
          <span className={Style.Header}>File type</span>
          <EllipsisText className={Style.Body}>{this.state.entity?.file_extension.mime_type ?? ""}</EllipsisText>
        </div>
        {this.renderAudioDetails()}
        {this.renderImageDetails()}
        {this.renderVideoDetails()}
      </Loader>
    );
  };


  private readonly renderAudioDetails = () => {
    const element = this.state.element as HTMLAudioElement;
    if (this.state.entity?.file_extension.file_type.name !== FileTypeName.AUDIO || !element) return null;
    console.dir(element);

    return (
      <Loader size={Size.LARGE} show={this.state.loading_data}>
        <div className={Style.Info}>
          <span className={Style.Header}>Video Length</span>
          <EllipsisText className={Style.Body}>{Helper.getDuration(element.duration)}</EllipsisText>
        </div>
      </Loader>
    );
  };

  private readonly renderImageDetails = () => {
    const element = this.state.element as HTMLImageElement;
    if (this.state.entity?.file_extension.file_type.name !== FileTypeName.IMAGE || !element) return null;

    return (
      <Loader size={Size.LARGE} show={this.state.loading_data}>
        <div className={Style.Info}>
          <span className={Style.Header}>Image dimensions</span>
          <EllipsisText className={Style.Body}>{`${element.naturalWidth}px 🞩 ${element.naturalHeight}px`}</EllipsisText>
        </div>
      </Loader>
    );
  };

  private readonly renderVideoDetails = () => {
    const element = this.state.element as HTMLVideoElement;
    if (this.state.entity?.file_extension.file_type.name !== FileTypeName.VIDEO || !element) return null;
    console.dir(element.duration);

    return (
      <Loader size={Size.LARGE} show={this.state.loading_data}>
        <div className={Style.Info}>
          <span className={Style.Header}>Video dimensions</span>
          <EllipsisText className={Style.Body}>{`${element.videoWidth}px 🞩 ${element.videoHeight}px`}</EllipsisText>
        </div>
        <div className={Style.Info}>
          <span className={Style.Header}>Video Length</span>
          <EllipsisText className={Style.Body}>{Helper.getDuration(element.duration)}</EllipsisText>
        </div>
      </Loader>
    );
  };

  private readonly eventLoad = (event: React.SyntheticEvent<HTMLElement>) => this.setState({loading_data: false, element: event.currentTarget});

}

enum FileAliasPageQuery {
  ALIAS = "alias",
}

interface FileAliasPageProps extends PageProps {
  [FileAliasPageQuery.ALIAS]: string
}

interface State {
  data?: any
  element?: HTMLElement
  entity?: FileEntity
  loading_data: boolean
  loading_file: boolean
}
