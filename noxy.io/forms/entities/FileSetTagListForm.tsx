import React from "react";
import Button from "../../components/Form/Button";
import EntityMultiSelect from "../../components/Form/EntityMultiSelect";
import ErrorText from "../../components/Text/ErrorText";
import TitleText from "../../components/Text/TitleText";
import FileTagEntity from "../../entities/FileTagEntity";
import ButtonType from "../../enums/ButtonType";
import Global from "../../Global";
import Util from "../../Util";
import Style from "./FileSetTagListForm.module.scss";

export default class FileSetTagListForm extends React.Component<FileSetTagListFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: FileSetTagListFormProps) {
    super(props);

    this.state = {
      list: props.file_tag_list ?? [],
    };
  }

  public readonly submit = async () => {
    Util.schedule(() => this.props.onSubmit(this.state.list));
  };

  public render() {

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>Select File Tag(s)</TitleText>
        {this.renderError()}
        <EntityMultiSelect className={Style.Select} label={"Search for tags"} method={this.eventFileTagSearch} property={"name"} onChange={this.eventFileTagChange}>
          {this.state.list}
        </EntityMultiSelect>
        <Button type={ButtonType.SUCCESS} onClick={this.submit}>Choose tag(s)</Button>
      </div>
    );
  }

  private readonly renderError = () => {
    if (!this.state.error) return;

    return (
      <ErrorText className={Style.Error}>{this.state.error?.message}</ErrorText>
    );
  };

  private readonly eventFileTagSearch = async (name: string) => {
    return name ? await FileTagEntity.findMany({name, exclude: this.state.list}) : [];
  };

  private readonly eventFileTagChange = (list: FileTagEntity[]) => {
    this.setState({list});
  };

}

export interface FileSetTagListFormProps {
  className?: string

  file_tag_list?: FileTagEntity[]

  onSubmit: (file_tag_list: FileTagEntity[]) => void
}

interface State {
  error?: Error
  list: FileTagEntity[]
}
