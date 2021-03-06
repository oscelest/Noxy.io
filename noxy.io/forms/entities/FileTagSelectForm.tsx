import React from "react";
import Dialog from "../../components/Application/Dialog";
import EntityPicker from "../../components/Form/EntityPicker";
import FileTagEntity from "../../entities/file/FileTagEntity";
import ConfirmForm from "../ConfirmForm";
import Style from "./FileTagSelectForm.module.scss";
import Form from "../../components/Base/Form";
import Component from "../../components/Application/Component";
import Util from "../../../common/services/Util";

export default class FileTagSelectForm extends Component<FileSetTagListFormProps, State> {

  constructor(props: FileSetTagListFormProps) {
    super(props);
    this.state = {
      selected:  this.props.selected ?? [],
      available: [],
    };
  }

  public readonly submit = async () => {
    Util.schedule(() => this.props.onSubmit(this.state.selected));
  };

  public componentDidMount(): void {
    this.setState({selected: this.props.selected});
  }

  public render() {
    const {error} = this.state;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <Form className={classes.join(" ")} error={error} onSubmit={this.submit}>
        <EntityPicker className={Style.FileTagList} selected={this.state.selected} available={this.state.available} horizontal={true}
                      onRender={FileTagEntity.render} onSearch={this.eventTagSearch} onCreate={this.eventTagCreate} onChange={this.eventTagChange} onDelete={this.openTagDeleteDialog}/>
      </Form>
    );
  }

  private readonly eventTagSearch = async (name: string) => {
    this.setState({available: await FileTagEntity.getMany({name, exclude: this.state.selected})});
  };

  private readonly eventTagCreate = async (name: string) => {
    return FileTagEntity.createOne({name});
  };

  private readonly eventTagChange = async (selected: FileTagEntity[], available: FileTagEntity[]) => {
    this.setState({selected, available});
  };

  private readonly openTagDeleteDialog = async (tag: FileTagEntity, selected: FileTagEntity[], available: FileTagEntity[]) => {
    const value = {tag, selected, available};
    this.setState({dialog: Dialog.show(<ConfirmForm value={value} onAccept={this.eventTagDelete}/>, {title: "Permanently delete tag?"})});
  };

  private readonly eventTagDelete = async ({tag, selected, available}: {tag: FileTagEntity, selected: FileTagEntity[], available: FileTagEntity[]}) => {
    await FileTagEntity.deleteOne(tag);
    Dialog.close(this.state.dialog);
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
  dialog?: string
  selected: FileTagEntity[]
  available: FileTagEntity[];
}
