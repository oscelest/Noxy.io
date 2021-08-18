import React from "react";
import FileTypeName from "../../../common/enums/FileTypeName";
import FileEntity from "../../entities/File/FileEntity";
import IconType from "../../enums/IconType";
import Icon from "../Form/Icon";
import Style from "./Preview.module.scss";
import Component from "../Application/Component";

export default class Preview extends Component<PreviewProps, State> {

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
    if (this.props.file) return this.props.file.file_extension.type;
    return this.props.type;
  };

  private readonly getPath = () => {
    if (this.props.file) return this.props.file.getDataPath();
    return this.props.path;
  };

  private readonly renderPreview = () => {
    switch (this.getFileType()) {
      case FileTypeName.AUDIO:
        return <Icon className={Style.Icon} type={IconType.FILE_AUDIO}/>;
      case FileTypeName.APPLICATION:
        return <Icon className={Style.Icon} type={IconType.FILE_EXE}/>;
      case FileTypeName.FONT:
        return <Icon className={Style.Icon} type={IconType.FILE_DOCUMENT}/>;
      case FileTypeName.IMAGE:
        return <img className={Style.Image} src={this.getPath()} alt={""}/>;
      case FileTypeName.TEXT:
        return <Icon className={Style.Icon} type={IconType.FILE_TEXT}/>;
      case FileTypeName.VIDEO:
        return <Icon className={Style.Icon} type={IconType.FILE_VIDEO}/>;
      default:
        return <Icon className={Style.Icon} type={IconType.FILE_FILE}/>;
    }
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
  type: FileTypeName
}

export interface PreviewDefaultProps {
  children?: never
  className?: string
}

interface State {

}
