import _ from "lodash";
import Router from "next/router";
import React from "react";
import Order from "../../../common/enums/Order";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import SetOperation from "../../../common/enums/SetOperation";
import FileEntity, {FileEntitySearchParameters} from "../../entities/FileEntity";
import FileTagEntity from "../../entities/FileTagEntity";
import FileTypeEntity from "../../entities/FileTypeEntity";
import IconType from "../../enums/IconType";
import Size from "../../enums/Size";
import FileRenameForm from "../../forms/entities/FileRenameForm";
import FileSetTagListForm from "../../forms/entities/FileSetTagListForm";
import FileUploadForm from "../../forms/entities/FileUploadForm";
import Global from "../../Global";
import Util from "../../Util";
import Icon from "../Base/Icon";
import ElementDialog from "../Dialog/ElementDialog";
import Button from "../Form/Button";
import Input from "../Form/Input";
import Sortable, {SortableCollection} from "../Form/Sortable";
import Switch from "../Form/Switch";
import Tickable, {TickableCollection} from "../Form/Tickable";
import Pagination from "../Table/Pagination";
import EllipsisText from "../Text/EllipsisText";
import {ContextMenuItem} from "../UI/ContextMenu";
import DragDrop from "../UI/DragDrop";
import ElementBrowser from "../UI/ElementBrowser";
import Loader from "../UI/Loader";
import Preview from "../UI/Preview";
import Redirect from "../UI/Redirect";
import Authorized from "./Authorized";
import Dialog, {DialogListenerType, DialogPriority} from "./Dialog";
import Style from "./FileExplorer.module.scss";

// noinspection JSUnusedGlobalSymbols
export default class FileExplorer extends React.Component<FileBrowserProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: FileBrowserProps) {
    super(props);

    this.state = {
      ref_dialog:       React.createRef(),
      ref_context_menu: React.createRef(),

      context_menu: false,

      file_loading:  true,
      file_search:   "",
      file_list:     [],
      file_selected: [],
      file_order:    {
        name:         {order: undefined, text: "File name", icon: IconType.TEXT_HEIGHT},
        size:         {order: undefined, text: "File size", icon: IconType.CUBE},
        time_created: {order: Order.DESC, text: "Upload date", icon: IconType.CLOCK},
      },

      tag_loading:        true,
      tag_search:         "",
      tag_set_operation:  SetOperation.UNION,
      tag_selected_list:  [],
      tag_available_list: [],

      type_selected_list:       [],
      type_tickable_collection: {},

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
        file_type_list:         this.state.type_selected_list,
        file_tag_list:          this.state.tag_selected_list,
        file_tag_set_operation: this.state.tag_set_operation,
      };

      try {
        const count = await FileEntity.count(params);
        next_state.pagination_total = Util.getPageTotal(count, this.state.pagination_size);
        next_state.pagination_current = _.clamp(this.state.pagination_current, 1, next_state.pagination_total);

        const skip = (next_state.pagination_current - 1) * this.state.pagination_size;
        const limit = next_state.pagination_current * this.state.pagination_size;
        const order = _.mapValues(this.state.file_order, value => value.order);

        next_state.file_list = await FileEntity.findMany(params, {skip, limit, order});
      }
      catch (error) {
        console.error(error);
      }

      this.setState(next_state);
    },
    500,
  );

  public readonly searchTag = (filter: Partial<State> = {}) => {
    this.setState({tag_loading: true, ...filter} as State);
    this.searchTagInternal();
  };

  private readonly searchTagInternal = _.debounce(
    async () => {
      const next_state = {tag_loading: false} as State;

      try {
        next_state.tag_available_list = this.sortTagList(await FileTagEntity.findMany({name: this.state.tag_search, exclude: this.state.tag_selected_list}));
      }
      catch (error) {
        console.error(error);
      }
      this.setState(next_state);
    },
    500,
  );

  private readonly sortTagList = (list: FileTagEntity[]) => {
    return list.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
  };

  private readonly getSelectedFileEntityList = () => {
    return _.reduce(this.state.file_selected, (result, value, index) => value ? [...result, this.state.file_list[index]] : result, [] as FileEntity[]);
  };

  private readonly closeDialog = () => {
    return this.state.ref_dialog.current?.close();
  };

  public async componentDidMount() {
    const file_type_list = await FileTypeEntity.findMany();
    const type_tickable_collection = _.reduce(file_type_list, (result, value) => _.set(result, value.id, Tickable.createElement(value, value.toString())), {} as TickableCollection<FileTypeEntity>);

    this.setState({type_tickable_collection});
    this.searchTag();
    this.searchFile();
  }

  public render() {
    const {type_tickable_collection} = this.state;
    const {tag_search, tag_set_operation} = this.state;
    const {file_loading, file_selected, file_list, file_order} = this.state;

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
            <DragDrop className={Style.DragDrop} title={drag_drop_title} message={drag_drop_text} listener={DialogListenerType.FILE_BROWSER} onDrop={this.openUploadDialog}>
              <Loader className={Style.Loader} show={file_loading} size={Size.LARGE}>
                <ElementBrowser className={Style.Browser} selection={file_selected}
                                onSelect={this.eventElementBrowserSelect} onDelete={this.openDeleteDialog} onContextMenu={this.eventElementBrowserContextMenu}>
                  {_.map(file_list, this.renderFile)}
                </ElementBrowser>
              </Loader>
            </DragDrop>

            {this.renderPagination()}
          </div>

          <div className={Style.Sidebar}>
            <div className={Style.FileSearch}>
              <Input className={Style.Input} label={"Search"} onChange={this.eventFileSearchChange}/>
              <Button icon={IconType.UPLOAD} value={[]} disabled={!this.context.hasPermission(PermissionLevel.FILE_CREATE)} onClick={this.openUploadDialog}/>
            </div>
            <Sortable onChange={this.eventOrderChange}>{file_order}</Sortable>

            <Tickable className={Style.FileTypeList} onChange={this.eventTypeChange}>{type_tickable_collection}</Tickable>

            <div className={Style.TagSearch}>
              <Input className={Style.Input} label={"Search for tags"} value={tag_search} onChange={this.eventTagSearchChange}/>
              <Button className={Style.Button} icon={IconType.UI_ADD} value={tag_search} disabled={!this.context.hasPermission(PermissionLevel.FILE_TAG_CREATE)} onClick={this.eventTagCreateClick}/>
            </div>

            <Switch className={Style.Switch} value={tag_set_operation} onChange={this.eventTagSetOperationChange}>
              {{
                "Match Any": SetOperation.UNION,
                "Match All": SetOperation.INTERSECTION,
              }}
            </Switch>

            <div className={Style.TagList}>
              {this.renderFileTagSelectedList()}
              {this.renderFileTagAvailableList()}
            </div>
          </div>

        </div>

      </Authorized>
    );
  }

  private readonly renderPagination = () => {
    if (this.state.pagination_total === 1) return null;

    return (
      <Pagination className={Style.Pagination} current={this.state.pagination_current} total={this.state.pagination_total} onChange={this.eventPaginationChange}/>
    );
  };

  private readonly renderFile = (file: FileEntity, index: number = 0) => {
    return (
      <div key={index} className={Style.File}>
        <Redirect className={Style.Redirect} href={`/file/${file.alias}`} isDoubleClick={true}>
          <Preview className={Style.FilePreview} path={file.getAPIPath()} type={file.file_extension.file_type.name}/>
          <EllipsisText className={Style.FileName}>{file.name}</EllipsisText>
        </Redirect>
      </div>
    );
  };

  private readonly renderFileTagSelectedList = () => {
    if (!this.state.tag_selected_list.length) return null;

    return (
      <div className={Style.Selected}>
        {_.map(this.state.tag_selected_list, this.renderFileTag)}
      </div>
    );
  };

  private readonly renderFileTagAvailableList = () => {
    if (!this.state.tag_available_list.length) return null;

    return (
      <div className={Style.Available}>
        <Loader show={this.state.tag_loading}>
          {_.map(this.state.tag_available_list, this.renderFileTag)}
        </Loader>
      </div>
    );
  };

  private readonly renderFileTag = (file_tag: FileTagEntity, index: number = 0) => {
    const current = _.find(this.state.tag_selected_list, entity => entity.getPrimaryKey() === file_tag.getPrimaryKey());

    return (
      <div key={index} className={Style.Tag} onClick={current ? this.eventTagRemove : this.eventTagAdd}>
        <Icon className={Style.Icon} type={current ? IconType.UI_REMOVE : IconType.UI_ADD}/>
        <span className={Style.Text}>{file_tag.name} ({file_tag.size})</span>
      </div>
    );
  };

  private readonly openDeleteDialog = async () => {
    const count = _.filter(this.state.file_selected).length;
    const title = count === 1 ? "Permanently delete this file?" : `Permanently delete ${_.filter(this.state.file_selected).length} file(s)?`;

    Dialog.show(DialogListenerType.GLOBAL, DialogPriority.NEXT,
      <ElementDialog ref={this.state.ref_dialog} title={title}>
        <div className={Style.DialogButtonContainer}>
          <Button className={Style.DialogButton} onClick={this.closeDialog}>Cancel</Button>
          <Button className={Style.DialogButton} onClick={this.eventDialog}>Delete</Button>
        </div>
      </ElementDialog>,
    );
  };

  private readonly openUploadDialog = (file_list: FileList | File[] = []) => {
    if (!this.context.hasPermission(PermissionLevel.FILE_CREATE)) return;

    Dialog.show(DialogListenerType.GLOBAL, DialogPriority.NEXT,
      <ElementDialog onClose={this.searchFile}>
        <FileUploadForm file_list={_.values(file_list)} file_tag_list={this.state.tag_selected_list}/>
      </ElementDialog>,
    );
  };

  private readonly openRenameDialog = () => {
    Dialog.show(DialogListenerType.GLOBAL, DialogPriority.NEXT,
      <ElementDialog ref={this.state.ref_dialog}>
        <FileRenameForm file_list={this.getSelectedFileEntityList()} onSubmit={this.eventContextMenuRenameSubmit}/>
      </ElementDialog>,
    );
  };

  private readonly openTagDialog = () => {
    Dialog.show(DialogListenerType.GLOBAL, DialogPriority.NEXT,
      <ElementDialog ref={this.state.ref_dialog}>
        <FileSetTagListForm file_tag_list={this.state.tag_selected_list} onSubmit={this.eventContextMenuSetTagListSubmit}/>
      </ElementDialog>,
    );
  };

  private readonly eventDialog = async () => {
    this.closeDialog();
    await Promise.all(_.map(this.state.file_selected, async (value, index) => value ? await FileEntity.removeByID(this.state.file_list[index]) : false));
    this.searchFile();
  };

  private readonly eventTagSetOperationChange = (tag_set_operation: SetOperation) => this.searchFile({tag_set_operation});
  private readonly eventElementBrowserSelect = (file_selected: boolean[]) => this.setState({file_selected});
  private readonly eventOrderChange = (file_order: SortableCollection<SortOrder>) => this.searchFile({file_order});
  private readonly eventFileSearchChange = (file_search: string) => this.searchFile({file_search});
  private readonly eventTagSearchChange = (tag_search: string) => this.searchTag({tag_search});
  private readonly eventPaginationChange = (pagination_current: number) => this.searchFile({pagination_current});
  private readonly eventTagCreateClick = async (name: string) => this.searchFile({tag_selected_list: this.sortTagList([...this.state.tag_selected_list, await FileTagEntity.create({name})])});

  private readonly eventTagAdd = (event: React.MouseEvent<HTMLDivElement>) => {
    const tag = Util.getReactChildObject(event.currentTarget, this.state.tag_available_list);
    const list = [...this.state.tag_selected_list];
    if (tag) list.push(tag);
    const tag_selected_list = this.sortTagList(list);
    this.searchTag({tag_selected_list});
    this.searchFile({tag_selected_list});
  };

  private readonly eventTagRemove = (event: React.MouseEvent<HTMLDivElement>) => {
    const tag = Util.getReactChildObject(event.currentTarget, this.state.tag_selected_list);
    const tag_selected_list = _.filter(this.state.tag_selected_list, v => v.getPrimaryKey() !== tag?.getPrimaryKey());
    this.searchTag({tag_selected_list});
    this.searchFile({tag_selected_list});
  };

  private readonly eventTypeChange = (type_tickable_collection: TickableCollection<FileTypeEntity>) => {
    const type_selected_list = _.reduce(type_tickable_collection, (result, tick) => (tick.checked ? [...result, tick.value] : result), [] as FileTypeEntity[]);
    this.searchFile({type_tickable_collection, type_selected_list});
  };



  private readonly eventElementBrowserContextMenu = (selected: boolean[]): {[key: string]: ContextMenuItem} => {
    const count = _.reduce(selected, (result, value) => value ? result + 1 : result, 0);

    if (count === 0) {
      return {
        "upload": {icon: IconType.UPLOAD, text: "Upload file", action: this.openUploadDialog},
        // "tags":    {icon: IconType.UI_SETTINGS, text: "Manage tags", action: this.eventContextMenuOpen},
        "refresh": {icon: IconType.REFRESH, text: "Refresh", action: this.searchFile},
        "reset":   {icon: IconType.NOT_ALLOWED, text: "Reset filters", action: this.eventContextMenuReset},
      };
    }

    if (count === 1) {
      return {
        "open":      {text: "Open", action: this.eventContextMenuOpen},
        "open_tab":  {text: "Open in a new tab", action: this.eventContextMenuOpenTab},
        "copy_link": {icon: IconType.LINK, text: "Copy link", action: this.eventContextMenuCopyLink},
        "rename":    {icon: IconType.EDIT_ALT, text: "Rename", action: this.openRenameDialog},
        "tags":      {icon: IconType.TAGS, text: "Set tags", action: this.openTagDialog},
        "download":  {icon: IconType.DOWNLOAD, text: "Download", action: this.eventContextMenuDownload},
        // "share":     {icon: IconType.SHARE, text: "Share", action: () => {}},
        "delete": {icon: IconType.BIN, text: "Delete", action: this.openDeleteDialog},
      };
    }

    return {
      "copy_link": {icon: IconType.LINK, text: "Copy links", action: this.eventContextMenuCopyLink},
      "rename":    {icon: IconType.EDIT_ALT, text: "Rename", action: this.openRenameDialog},
      "tags":      {icon: IconType.TAGS, text: "Set tags", action: this.openTagDialog},
      // "share":     {icon: IconType.SHARE, text: "Share", action: () => {}},
      "delete":   {icon: IconType.BIN, text: "Delete", action: this.openDeleteDialog},
      "download": {icon: IconType.DOWNLOAD, text: "Download", action: this.eventContextMenuDownload},
    };
  };

  private readonly eventContextMenuOpen = () => Router.push(`${location.href}/${this.state.file_list[_.findIndex(this.state.file_selected)].id}`);
  private readonly eventContextMenuOpenTab = () => window.open(`${location.href}/${this.state.file_list[_.findIndex(this.state.file_selected)].id}`, "_blank");
  private readonly eventContextMenuCopyLink = () => Util.setClipboard(this.state.file_selected.reduce((r, v, i) => v ? [...r, this.state.file_list[i].getPath()] : r, [] as string[]).join("\n"));

  private readonly eventContextMenuReset = () => {
    this.searchFile({});
    this.searchTag();
  };


  private readonly eventContextMenuRenameSubmit = async (file_list: FileEntity[]) => {
    this.closeDialog();
    await Promise.all(_.map(file_list, async (value, i) => value ? await FileEntity.updateByID(file_list[i], file_list[i]) : false));
    this.searchFile();
  };

  private readonly eventContextMenuSetTagListSubmit = async (file_tag_list: FileTagEntity[]) => {
    this.closeDialog();
    await Promise.all(_.map(this.state.file_selected, async (value, i) => value ? await FileEntity.updateByID(this.state.file_list[i], {...this.state.file_list[i], file_tag_list}) : false));
    this.searchFile();
    this.searchTag();
  };

  private readonly eventContextMenuDownload = async () => await FileEntity.confirmDownload(await FileEntity.requestDownload(_.filter(this.state.file_list, (e, key) => this.state.file_selected[key])));

}

type SortOrder = Pick<FileEntity, "name" | "size" | "time_created">

export interface FileBrowserProps {
  className?: string

  search?: string
  order?: SortableCollection<SortOrder>

  set_operation?: SetOperation
  tags?: FileTagEntity[]
  types?: FileTypeEntity[]

  size?: number
  page?: number

  onSearch?(filter: Partial<State>): void
}

interface State {
  ref_dialog: React.RefObject<ElementDialog>
  ref_context_menu: React.RefObject<HTMLDivElement>

  context_menu: boolean

  file_loading: boolean
  file_search: string
  file_list: FileEntity[]
  file_selected: boolean[]
  file_order: SortableCollection<SortOrder>

  tag_loading: boolean
  tag_search: string
  tag_set_operation: SetOperation
  tag_selected_list: FileTagEntity[]
  tag_available_list: FileTagEntity[]

  type_selected_list: FileTypeEntity[]
  type_tickable_collection: TickableCollection<FileTypeEntity>

  pagination_size: number
  pagination_total: number
  pagination_current: number
}
