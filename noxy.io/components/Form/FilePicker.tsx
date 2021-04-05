import React from "react";
import Button from "./Button";
import Style from "./FilePicker.module.scss";

export default class FilePicker extends React.Component<FileBrowserProps, State> {
  
  constructor(props: FileBrowserProps) {
    super(props);
  }
  
  private readonly eventChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onChange(event.target.files ?? new FileList(), event);
    event.target.value = "";
    event.target.files = null;
  };
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <label className={classes.join(" ")}>
        <Button className={Style.Button}>{this.props.children}</Button>
        <input className={Style.Value} type={"file"} onChange={this.eventChange} multiple={this.props.multiple}/>
      </label>
    );
  }
}

export interface FileBrowserProps {
  multiple?: boolean
  
  className?: string
  onChange: (files: FileList, event: React.ChangeEvent<HTMLInputElement>) => void
}

interface State {

}
