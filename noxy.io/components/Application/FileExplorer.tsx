import _ from "lodash";
import Router from "next/router";
import React from "react";
import Helper from "../../Helper";
import Dialog from "./Dialog";
import Authorized from "./Authorized";
import Conditional from "./Conditional";
import FileEntity, {FileEntitySearchParameters} from "../../entities/file/FileEntity";
import FileTagEntity from "../../entities/file/FileTagEntity";
import ConfirmForm from "../../forms/ConfirmForm";
import FileUploadForm from "../../forms/entities/FileUploadForm";
import FileRenameForm from "../../forms/entities/FileRenameForm";
import FileTagSelectForm from "../../forms/entities/FileTagSelectForm";
import {FileAliasPageQuery} from "../../pages/file/[id]";
import Input from "../Form/Input";
import Button from "../Form/Button";
import Switch from "../Form/Switch";
import Sortable, {SortableCollection} from "../Form/Sortable";
import Checkbox, {CheckboxCollection} from "../Form/Checkbox";
import EntityPicker from "../Form/EntityPicker";
import Pagination from "../Table/Pagination";
import EllipsisText from "../Text/EllipsisText";
import Loader from "../UI/Loader";
import Preview from "../UI/Preview";
import DragDrop from "../UI/DragDrop";
import Redirect from "./Redirect";
import ElementBrowser from "../UI/ElementBrowser";
import {ContextMenuItem} from "../UI/ContextMenu";
import Size from "../../enums/Size";
import IconType from "../../enums/IconType";
import Order from "../../../common/enums/Order";
import Privacy from "../../../common/enums/Privacy";
import SetOperation from "../../../common/enums/SetOperation";
import FileTypeName from "../../../common/enums/FileTypeName";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import Style from "./FileExplorer.module.scss";
import Component from "./Component";

// noinspection JSUnusedGlobalSymbols
export default class FileExplorer extends Component<FileBrowserProps, State> {

  private static defaultOrder = {
    name:         {order: undefined, text: "File name", icon: IconType.TEXT_HEIGHT},
    size:         {order: undefined, text: "File size", icon: IconType.CUBE},
    time_created: {order: Order.DESC, text: "Upload date", icon: IconType.CLOCK},
  };

  constructor(props: FileBrowserProps) {
    super(props);

    this.state = {
      ref_context_menu:  React.createRef(),
      ref_entity_picker: React.createRef(),

      dialog_change_tag:  false,
      dialog_change_file: false,

      context_menu: false,

      file_loading:  true,
      file_search:   "",
      file_list:     [],
      file_selected: [],
      file_order:    FileExplorer.defaultOrder,

      tag_set_operation:  SetOperation.UNION,
      tag_selected_list:  [],
      tag_available_list: [],

      type_tickable_collection: {
        AUDIO:       Checkbox.createElement(FileTypeName.AUDIO, "Audio"),
        APPLICATION: Checkbox.createElement(FileTypeName.APPLICATION, "Application"),
        FONT:        Checkbox.createElement(FileTypeName.FONT, "Font"),
        IMAGE:       Checkbox.createElement(FileTypeName.IMAGE, "Image"),
        TEXT:        Checkbox.createElement(FileTypeName.TEXT, "Text"),
        VIDEO:       Checkbox.createElement(FileTypeName.VIDEO, "Video"),
      },

      pagination_current: 1,
      pagination_total:   1,
      pagination_size:    this.props.size || 50,
    };
  }

  public readonly searchFile = (filter: Partial<State> = {}) => {
    this.setState({file_loading: true, ...filter} as State);
    this.searchFileInternal();
  };

  private readonly searchFileInternal = _.debounce(
    async () => {
      const next_state = {file_loading: false} as State;

      const params: FileEntitySearchParameters = {
        name:                   this.state.file_search,
        file_type_list:         _.reduce(this.state.type_tickable_collection, (result, value) => value.checked ? [...result, value.value] : result, [] as FileTypeName[]),
        file_tag_list:          this.state.tag_selected_list,
        file_tag_set_operation: this.state.tag_set_operation,
      };

      try {
        const count = await FileEntity.getCount(params);
        next_state.pagination_total = Helper.getPageTotal(count, this.state.pagination_size);
        next_state.pagination_current = _.clamp(this.state.pagination_current, 1, next_state.pagination_total);

        const skip = (next_state.pagination_current - 1) * this.state.pagination_size;
        const limit = next_state.pagination_current * this.state.pagination_size;
        const order = _.mapValues(this.state.file_order, value => value.order);

        next_state.file_list = await FileEntity.getMany(params, {skip, limit, order});
      }
      catch (error) {
        console.error(error);
      }

      this.setState(next_state);
    },
    500,
  );

  private readonly getSelectedFileList = () => {
    return _.reduce(this.state.file_selected, (result, value, index) => value ? [...result, this.state.file_list[index]] : result, [] as FileEntity[]);
  };

  private readonly closeDialog = () => {
    Dialog.close(this.state.dialog);
  };

  public async componentDidMount() {
    this.searchFile();
  }

  public render() {
    const {type_tickable_collection} = this.state;
    const {tag_set_operation, tag_selected_list, tag_available_list} = this.state;
    const {file_loading, file_selected, file_list, file_order, file_search} = this.state;
    const {pagination_current, pagination_total} = this.state;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    const drag_drop_title = this.context.hasPermission(PermissionLevel.FILE_CREATE)
      ? "Drop files here to upload"
      : "No permission to upload files";
    const drag_drop_text = this.context.hasPermission(PermissionLevel.FILE_CREATE)
      ? "Files dropped here will automatically be added to the upload file dialog."
      : "You do not have permission to upload files yet. Until you gain permission to upload files, you will not be able to drop files here.";

    return (
      <Authorized>

        <div className={classes.join(" ")}>

          <div className={Style.Content}>
            <DragDrop className={Style.DragDrop} title={drag_drop_title} message={drag_drop_text} onDrop={this.openUploadDialog}>
              <Loader className={Style.Loader} show={file_loading} size={Size.LARGE}>
                <ElementBrowser className={Style.Browser} selection={file_selected} onSelect={this.eventSelect} onDelete={this.openFileDeleteDialog} onContextMenu={this.eventContextMenu}>
                  {_.map(file_list, this.renderFile)}
                </ElementBrowser>
              </Loader>
            </DragDrop>

            <Conditional condition={pagination_total > 1}>
              <Pagination className={Style.Pagination} current={pagination_current} total={pagination_total} onChange={this.eventPaginationChange}/>
            </Conditional>
          </div>

          <div className={Style.Sidebar}>
            <div className={Style.FileSearch}>
              <Input className={Style.Input} value={file_search} label={"Search"} onChange={this.eventFileSearchChange}/>
              <Conditional condition={this.context.hasPermission(PermissionLevel.FILE_CREATE)}>
                <Button icon={IconType.UPLOAD} onClick={this.openUploadDialog}/>
              </Conditional>
            </div>
            <Sortable onChange={this.eventOrderChange}>{file_order}</Sortable>

            <Checkbox className={Style.FileTypeList} onChange={this.eventTypeChange}>{type_tickable_collection}</Checkbox>

            <Switch className={Style.Switch} value={tag_set_operation} onChange={this.eventSetOperationChange}>
              {{
                "Match Any": SetOperation.UNION,
                "Match All": SetOperation.INTERSECTION,
              }}
            </Switch>

            <EntityPicker ref={this.state.ref_entity_picker} selected={tag_selected_list} available={tag_available_list}
                          onRender={this.eventTagRender} onSearch={this.eventTagSearch} onCreate={this.eventTagCreate} onChange={this.eventTagChange} onDelete={this.openTagDeleteDialog}/>
          </div>

        </div>

      </Authorized>
    );
  }

  private readonly renderFile = (file: FileEntity, index: number = 0) => {
    const href = file.privacy === Privacy.LINK ? `/file/${file.id}?${FileAliasPageQuery.SHARE_HASH}=${file.share_hash}` : `/file/${file.id}`;

    return (
      <div key={index} className={Style.File}>
        <Redirect className={Style.Redirect} href={href} isDoubleClick={true}>
          <Preview className={Style.FilePreview} file={file}/>
          <EllipsisText className={Style.FileName}>{file.name}</EllipsisText>
        </Redirect>
      </div>
    );
  };

  // region    ----- Dialogs -----    region //

  private readonly openUploadDialog = (event: React.DragEvent) => {
    const file_list = event.dataTransfer?.files ?? [];
    if (!this.context.hasPermission(PermissionLevel.FILE_CREATE)) return;

    this.setState({
      dialog: Dialog.show(
        <FileUploadForm file_list={_.values(file_list)} file_tag_list={this.state.tag_selected_list} onFileUpload={this.eventUploadFileCreate} onTagCreate={this.eventUploadTagCreate}/>,
        {id: "file-explorer-drag-drop", title: "Upload file(s)", onClose: this.eventUploadDialogClose, drag: {title: "Test", message: "Test", onDrop: this.openUploadDialog}},
      ),
    });
  };

  private readonly eventUploadTagCreate = () => {
    this.setState({dialog_change_tag: true});
  };

  private readonly eventUploadFileCreate = () => {
    this.setState({dialog_change_tag: true, dialog_change_file: true});
  };

  private readonly eventUploadDialogClose = () => {
    if (this.state.dialog_change_file) this.searchFile();
  };

  private readonly openFileNameChangeDialog = () => {
    const file_list = this.getSelectedFileList();
    const title = file_list.length > 1 ? `Rename ${file_list.length} files` : "Rename file";
    this.setState({dialog: Dialog.show(<FileRenameForm files={file_list} onSubmit={this.eventFileNameChange}/>, {title})});
  };

  private readonly eventFileNameChange = async (file_list: FileEntity[]) => {
    Dialog.close(this.state.dialog);
    await Promise.all(_.map(file_list, async (value, i) => value ? await FileEntity.putOne(file_list[i], file_list[i]) : false));
    this.searchFile();
  };

  private readonly openFileTagChangeDialog = () => {
    this.setState({dialog: Dialog.show(<FileTagSelectForm selected={this.state.tag_selected_list} onSubmit={this.eventFileTagChange}/>)});
  };

  private readonly eventFileTagChange = async (file_tag_list: FileTagEntity[]) => {
    await Promise.all(_.map(this.state.file_selected, async (value, i) => value ? await FileEntity.putOne(this.state.file_list[i], {...this.state.file_list[i], file_tag_list}) : false));
    this.closeDialog();
    this.searchFile();
    this.state.ref_entity_picker.current?.search();
  };

  private readonly openFileDeleteDialog = async () => {
    const count = _.filter(this.state.file_selected).length;
    const title = count === 1 ? "Permanently delete file?" : `Permanently delete ${_.filter(this.state.file_selected).length} file(s)?`;
    this.setState({dialog: Dialog.show(<ConfirmForm value={this.getSelectedFileList()} onAccept={this.eventFileDelete} onDecline={this.closeDialog}/>, {title})});
  };

  private readonly eventFileDelete = async (file_list: FileEntity[]) => {
    await Promise.all(_.map(file_list, async file => FileEntity.deleteOne(file)));
    this.searchFile();
  };

  private readonly openTagDeleteDialog = async (tag: FileTagEntity, tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]) => {
    const value = {tag, tag_selected_list, tag_available_list};
    this.setState({dialog: Dialog.show(<ConfirmForm value={value} onAccept={this.eventTagDelete} onDecline={this.closeDialog}/>, {title: "Permanently delete tag?"})});
  };

  private readonly eventTagDelete = async ({tag, tag_selected_list, tag_available_list}: {tag: FileTagEntity, tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]}) => {
    await FileTagEntity.deleteOne(tag.id);
    this.closeDialog();
    this.searchFile({tag_selected_list, tag_available_list});
  };

  // endregion ----- Dialogs ----- endregion //

  // region    ----- Event handlers -----    region //


  private readonly eventTagRender = (tag: FileTagEntity) => {
    return tag.name;
  }

  private readonly eventTagSearch = async (name: string) => {
    this.setState({tag_available_list: await FileTagEntity.getMany({name, exclude: this.state.tag_selected_list})});
  };

  private readonly eventTagCreate = async (name: string) => {
    return FileTagEntity.createOne({name});
  };

  private readonly eventTagChange = async (tag_selected_list: FileTagEntity[], tag_available_list: FileTagEntity[]) => {
    this.searchFile({tag_selected_list, tag_available_list});
  };

  private readonly eventSetOperationChange = (tag_set_operation: SetOperation) => {
    this.searchFile({tag_set_operation});
  };

  private readonly eventSelect = (file_selected: boolean[]) => {
    this.setState({file_selected});
  };

  private readonly eventOrderChange = (file_order: SortableCollection<SortOrder>) => {
    this.searchFile({file_order});
  };

  private readonly eventFileSearchChange = (file_search: string) => {
    this.searchFile({file_search});
  };

  private readonly eventPaginationChange = (pagination_current: number) => {
    this.searchFile({pagination_current});
  };

  private readonly eventTypeChange = (type_tickable_collection: TypeCheckbox) => {
    this.searchFile({type_tickable_collection});
  };

  private readonly eventContextMenu = (selected: boolean[]): {[key: string]: ContextMenuItem} => {
    const count = _.reduce(selected, (result, value) => value ? result + 1 : result, 0);

    if (count === 0) {
      return {
        // "upload": {icon: IconType.UPLOAD, text: "Upload file", action: this.openUploadDialog},
        // "tags":    {icon: IconType.TAGS, text: "Manage tags", action: this.eventContextMenuOpen},
        "refresh": {icon: IconType.REFRESH, text: "Refresh", action: this.searchFile},
        "reset":   {icon: IconType.NOT_ALLOWED, text: "Reset filters", action: this.eventContextMenuReset},
      };
    }

    if (count === 1) {
      return {
        "open":      {text: "Open", action: this.eventContextMenuOpen},
        "open_tab":  {text: "Open in a new tab", action: this.eventContextMenuOpenTab},
        "copy_link": {icon: IconType.LINK, text: "Copy link", action: this.eventContextMenuCopyLink},
        "rename":    {icon: IconType.EDIT_ALT, text: "Rename", action: this.openFileNameChangeDialog},
        "tags":      {icon: IconType.TAGS, text: "Set tags", action: this.openFileTagChangeDialog},
        "download":  {icon: IconType.DOWNLOAD, text: "Download", action: this.eventContextMenuDownload},
        // "share":     {icon: IconType.SHARE, text: "Share", action: () => {}},
        "delete": {icon: IconType.BIN, text: "Delete", action: this.openFileDeleteDialog},
      };
    }

    return {
      "copy_link": {icon: IconType.LINK, text: "Copy links", action: this.eventContextMenuCopyLink},
      "rename":    {icon: IconType.EDIT_ALT, text: "Rename", action: this.openFileNameChangeDialog},
      "tags":      {icon: IconType.TAGS, text: "Set tags", action: this.openFileTagChangeDialog},
      // "share":     {icon: IconType.SHARE, text: "Share", action: () => {}},
      "delete":   {icon: IconType.BIN, text: "Delete", action: this.openFileDeleteDialog},
      "download": {icon: IconType.DOWNLOAD, text: "Download", action: this.eventContextMenuDownload},
    };
  };

  private readonly eventContextMenuOpen = () => {
    return Router.push(`${location.href}/${this.state.file_list[_.findIndex(this.state.file_selected)].id}`);
  };

  private readonly eventContextMenuOpenTab = () => {
    return window.open(`${location.href}/${this.state.file_list[_.findIndex(this.state.file_selected)].id}`, "_blank");
  };

  private readonly eventContextMenuCopyLink = () => {
    return Helper.setClipboard(this.state.file_selected.reduce((r, v, i) => v ? [...r, this.state.file_list[i].getFilePath()] : r, [] as string[]).join("\n"));
  };

  private readonly eventContextMenuReset = () => {
    this.searchFile({
      file_search:              "",
      file_order:               FileExplorer.defaultOrder,
      type_tickable_collection: _.mapValues(this.state.type_tickable_collection, val => ({...val, checked: false})) as TypeCheckbox,
      tag_selected_list:        [],
      tag_set_operation:        SetOperation.UNION,
    });
    this.state.ref_entity_picker.current?.search();
  };

  private readonly eventContextMenuDownload = async () => {
    await FileEntity.postConfirmDownload(await FileEntity.postRequestDownload(_.filter(this.state.file_list, (file, key) => this.state.file_selected[key])));
  };

  // endregion ----- Event handlers ----- endregion //

}

type SortOrder = "name" | "size" | "time_created"
type TypeCheckbox = CheckboxCollection<{ [K in keyof Omit<typeof FileTypeName, "UNKNOWN">]: typeof FileTypeName[K] }>

export interface FileBrowserProps {
  className?: string

  search?: string
  order?: SortableCollection<SortOrder>

  set_operation?: SetOperation
  tags?: FileTagEntity[]
  types?: FileTypeName[]

  size?: number
  page?: number

  onSearch?(filter: Partial<State>): void
}

interface State {
  ref_context_menu: React.RefObject<HTMLDivElement>
  ref_entity_picker: React.RefObject<EntityPicker<FileTagEntity>>

  dialog?: string
  dialog_change_file: boolean
  dialog_change_tag: boolean

  context_menu: boolean

  file_loading: boolean
  file_search: string
  file_list: FileEntity[]
  file_selected: boolean[]
  file_order: SortableCollection<SortOrder>

  tag_set_operation: SetOperation
  tag_selected_list: FileTagEntity[]
  tag_available_list: FileTagEntity[]

  type_tickable_collection: TypeCheckbox

  pagination_size: number
  pagination_total: number
  pagination_current: number
}
