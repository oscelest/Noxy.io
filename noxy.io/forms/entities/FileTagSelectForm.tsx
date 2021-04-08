import React from "react";
import SetOperation from "../../../common/enums/SetOperation";
import Button from "../../components/Form/Button";
import EntityMultiSelect from "../../components/Form/EntityMultiSelect";
import Switch from "../../components/Form/Switch";
import ErrorText from "../../components/Text/ErrorText";
import TitleText from "../../components/Text/TitleText";
import FileTagEntity from "../../entities/FileTagEntity";
import ButtonType from "../../enums/ButtonType";
import Global from "../../Global";
import Style from "./FileTagSelectForm.module.scss";

export default class FileTagSelectForm extends React.Component<FileTagSelectFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: FileTagSelectFormProps) {
    super(props);

    this.state = {
      list:              props.file_tag_list ?? [],
      set_operation:     props.file_tag_set_operation ?? SetOperation.UNION,
    };
  }

  public readonly submit = async () => {
    setTimeout(() => this.props.onSubmit(this.state.list, this.state.set_operation));
  };

  public render() {

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>Select File Tag(s)</TitleText>
        {this.renderError()}
        <Switch className={Style.Switch} value={this.state.set_operation} onChange={this.eventSwitchSetOperationChange}>
          {{
            "Match All": SetOperation.INTERSECTION,
            "Match Any": SetOperation.UNION,
          }}
        </Switch>
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

  private readonly eventSwitchSetOperationChange = (set_operation: SetOperation) => {
    this.setState({set_operation});
  };

  private readonly eventFileTagSearch = async (name: string) => {
    return name ? await FileTagEntity.findMany({name, exclude: this.state.list}) : [];
  };

  private readonly eventFileTagChange = (list: FileTagEntity[]) => {
    this.setState({list});
  };

}

export interface FileTagSelectFormProps {
  className?: string

  file_tag_list?: FileTagEntity[]
  file_tag_set_operation?: SetOperation

  onSubmit: (file_tag_list: FileTagEntity[], set_operation: SetOperation) => void
}

interface State {
  error?: Error
  list: FileTagEntity[]
  set_operation: SetOperation
}
