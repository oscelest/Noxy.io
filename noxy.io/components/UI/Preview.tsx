import React from "react";
import FileEntity from "../../entities/FileEntity";
import FileTypeEntity from "../../entities/FileTypeEntity";
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
  }

  private readonly getPath = () => {
    if (this.props.file) return this.props.file.getDataPath();
    return this.props.path;
  }


  private readonly renderPreview = () => {
    switch (this.getFileType()) {
      case "image":
        return this.renderPreviewImage();
      default:
        return this.renderPreviewUnavailable();
    }

  };

  private readonly renderPreviewImage = () => {
    return (
      <img className={Style.Image} src={this.getPath()} alt={""}/>
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
  type: FileTypeEntity | string
}

export interface PreviewDefaultProps {
  children?: never
  className?: string
}

interface State {

}
