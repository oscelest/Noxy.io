import React from "react";
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

  private readonly renderPreview = () => {
    switch (typeof this.props.type === "object" ? this.props.type.name : this.props.type) {
      case "image":
        return this.renderPreviewImage();
      default:
        return this.renderPreviewUnavailable();
    }

  };

  private readonly renderPreviewImage = () => {
    return (
      <img className={Style.Image} src={this.props.path} alt={""}/>
    );
  };

  private readonly renderPreviewUnavailable = () => {
    return (
      <span className={Style.Unavailable}>Preview unavailable</span>
    );
  };

}

export interface PreviewProps {
  path: string
  type: FileTypeEntity | string

  children?: never
  className?: string
}

interface State {

}
