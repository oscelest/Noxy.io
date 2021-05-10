import _ from "lodash";
import React from "react";
import Dialog, {DialogListenerType, DialogPriority} from "../../components/Application/Dialog";
import ConfirmDialog from "../../components/Dialog/ConfirmDialog";
import Button from "../../components/Form/Button";
import EntityPicker from "../../components/Form/EntityPicker";
import ErrorText from "../../components/Text/ErrorText";
import TitleText from "../../components/Text/TitleText";
import FileTagEntity from "../../entities/FileTagEntity";
import Global from "../../Global";
import Helper from "../../Helper";
import Style from "./FileTagSelectForm.module.scss";

export default class FileTagSelectForm extends React.Component<FileSetTagListFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: FileSetTagListFormProps) {
    super(props);
    this.state = {
      selected:  this.props.selected ?? [],
      available: [],
    };
  }

  public readonly submit = async () => {
    Helper.schedule(() => this.props.onSubmit(this.state.selected));
  };

  public componentDidMount(): void {
    this.setState({selected: this.props.selected});
  }

  public render() {

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>Select File Tag(s)</TitleText>
        {this.renderError()}
        <EntityPicker selected={this.state.selected} available={this.state.available}
                      onSearch={this.eventTagSearch} onCreate={this.eventTagCreate} onChange={this.eventTagChange} onDelete={this.openTagDeleteDialog}/>
        <Button onClick={this.submit}>Choose tag(s)</Button>
      </div>
    );
  }

  private readonly renderError = () => {
    if (!this.state.error) return;

    return (
      <ErrorText className={Style.Error}>{this.state.error?.message}</ErrorText>
    );
  };

  private readonly eventTagSearch = async (name: string) => {
    this.setState({available: await FileTagEntity.findMany({name, exclude: this.state.selected})});
  };

  private readonly eventTagCreate = async (name: string) => {
    return FileTagEntity.createOne({name});
  };

  private readonly eventTagChange = async (selected: FileTagEntity[], available: FileTagEntity[]) => {
    this.setState({selected, available});
  };

  private readonly openTagDeleteDialog = async (tag: FileTagEntity, selected: FileTagEntity[], available: FileTagEntity[]) => {
    const value = {tag, selected, available};
    Dialog.show(DialogListenerType.GLOBAL, DialogPriority.NEXT, <ConfirmDialog title={"Permanently delete tag?"} value={value} onAccept={this.eventTagDelete}/>);
  };

  private readonly eventTagDelete = async ({tag, selected, available}: {tag: FileTagEntity, selected: FileTagEntity[], available: FileTagEntity[]}) => {
    await FileTagEntity.deleteOne(tag);
    this.setState({selected, available});
  };

}

export interface FileSetTagListFormProps {
  className?: string

  selected: FileTagEntity[];

  onSubmit: (file_tag_list: FileTagEntity[]) => void
}

interface State {
  error?: Error
  available: FileTagEntity[];
  selected: FileTagEntity[]
}
