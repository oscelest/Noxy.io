import React from "react";
import FileTypeName from "../../../common/enums/FileTypeName";
import FileEntity from "../../entities/FileEntity";
import FileTypeEntity from "../../entities/FileTypeEntity";
import IconType from "../../enums/IconType";
import Icon from "../Base/Icon";
import Style from "./Preview.module.scss";

export default class Preview extends React.Component<PreviewProps, State> {

  constructor(props: PreviewProps) {
    super(props);
  }

  public render() {
    const {className} = this.props;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        {this.renderPreview()}
      </div>
    );
  }

  private readonly getFileType = () => {
    if (this.props.file) return this.props.file.file_extension.file_type.name;
    if (this.props.type instanceof FileTypeEntity) return this.props.type.name;
    return this.props.type;
  };

  private readonly getPath = () => {
    if (this.props.file) return this.props.file.getDataPath();
    return this.props.path;
  };


  private readonly renderPreview = () => {
    switch (this.getFileType()) {
      case FileTypeName.AUDIO:
        return this.renderPreviewAudio();
      case FileTypeName.APPLICATION:
        return this.renderPreviewApplication();
      case FileTypeName.FONT:
        return this.renderPreviewFont();
      case FileTypeName.IMAGE:
        return this.renderPreviewImage();
      case FileTypeName.TEXT:
        return this.renderPreviewText();
      case FileTypeName.VIDEO:
        return this.renderPreviewVideo();
      default:
        return this.renderPreviewUnavailable();
    }
  };


  private readonly renderPreviewAudio = () => {
    return (
      <Icon className={Style.Icon} type={IconType.FILE_AUDIO}/>
    );
  };

  private readonly renderPreviewApplication = () => {
    return (
      <Icon className={Style.Icon} type={IconType.FILE_EXE}/>
    );
  };

  private readonly renderPreviewFont = () => {
    return (
      <Icon className={Style.Icon} type={IconType.FILE_DOCUMENT}/>
    );
  };

  private readonly renderPreviewImage = () => {
    return (
      <img className={Style.Image} src={this.getPath()} alt={""}/>
    );
  };

  private readonly renderPreviewText = () => {
    return (
      <Icon className={Style.Icon} type={IconType.FILE_TEXT}/>
    );
  };

  private readonly renderPreviewVideo = () => {
    return (
      <Icon className={Style.Icon} type={IconType.FILE_VIDEO}/>
    );
  };

  private readonly renderPreviewUnavailable = () => {
    return (
      <span className={Style.Unavailable}>Preview unavailable</span>
    );
  };

}

export type PreviewProps = PreviewFileEntityProps | PreviewLooseProps;

interface PreviewFileEntityProps extends PreviewDefaultProps {
  file: FileEntity
  path?: never
  type?: never
}

interface PreviewLooseProps extends PreviewDefaultProps {
  file?: never
  path: string
  type: FileTypeEntity | FileTypeName
}

export interface PreviewDefaultProps {
  children?: never
  className?: string
}

interface State {

}
