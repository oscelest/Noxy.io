import _ from "lodash";
import React from "react";
import Order from "../../../common/enums/Order";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import SetOperation from "../../../common/enums/SetOperation";
import FileEntity, {FileEntitySearchParameters} from "../../entities/FileEntity";
import FileTagEntity from "../../entities/FileTagEntity";
import FileTypeEntity from "../../entities/FileTypeEntity";
import IconType from "../../enums/IconType";
import Size from "../../enums/Size";
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

  public static pageSize = 48;
  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: FileBrowserProps) {
    super(props);

    this.state = {
      ref_context_menu: React.createRef(),
      context_menu:     true,

      file_loading:  true,
      file_search:   "",
      file_list:     [],
      file_selected: [],
      file_order:    {
        name:         {order: Order.ASC, text: "File name", icon: IconType.TEXT_HEIGHT},
        size:         {order: undefined, text: "File size", icon: IconType.CUBE},
        time_created: {order: undefined, text: "Upload date", icon: IconType.CLOCK},
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
        next_state.pagination_total = Util.getPageTotal(count, FileExplorer.pageSize);
        next_state.pagination_current = _.clamp(this.state.pagination_current, 1, next_state.pagination_total);

        const skip = (next_state.pagination_current - 1) * FileExplorer.pageSize;
        const limit = next_state.pagination_current * FileExplorer.pageSize;
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
            <DragDrop className={Style.DragDrop} title={drag_drop_title} message={drag_drop_text} listener={DialogListenerType.FILE_BROWSER} onDrop={this.eventFileCreateClick}>
              <Loader className={Style.Loader} show={file_loading} size={Size.LARGE}>
                <ElementBrowser className={Style.Browser} selection={file_selected}
                                onSelect={this.eventElementBrowserSelect} onDelete={this.eventElementBrowserDelete} onContextMenu={this.eventElementBrowserContextMenu}>
                  {_.map(file_list, this.renderFile)}
                </ElementBrowser>
              </Loader>
            </DragDrop>

            {this.renderPagination()}
          </div>

          <div className={Style.Sidebar}>
            <div className={Style.FileSearch}>
              <Input className={Style.Input} label={"Search"} onChange={this.eventFileSearchChange}/>
              <Button icon={IconType.UPLOAD} value={[]} disabled={!this.context.hasPermission(PermissionLevel.FILE_CREATE)} onClick={this.eventFileCreateClick}/>
            </div>
            <Sortable onChange={this.eventOrderChange}>{file_order}</Sortable>

            <Tickable className={Style.FileTypeList} onChange={this.eventTypeChange}>{type_tickable_collection}</Tickable>

            <div className={Style.TagSearch}>
              <Input className={Style.Input} label={"Search for tags"} value={tag_search} onChange={this.eventTagSearchChange}/>
              <Button className={Style.Button} icon={IconType.ADD} value={tag_search} disabled={!this.context.hasPermission(PermissionLevel.FILE_TAG_CREATE)} onClick={this.eventTagCreateClick}/>
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

  private renderFile = (file: FileEntity, index: number = 0) => {
    return (
      <div key={index} className={Style.File}>
        <Redirect className={Style.Redirect} href={`/file/${file.alias}`} isDoubleClick={true}>
          <Preview className={Style.FilePreview} path={file.getPath()} type={file.file_extension.file_type.name}/>
          <EllipsisText className={Style.FileName}>{file.name}</EllipsisText>
        </Redirect>
      </div>
    );
  };

  private renderFileTagSelectedList = () => {
    if (!this.state.tag_selected_list.length) return null;

    return (
      <div className={Style.Selected}>
        {_.map(this.state.tag_selected_list, this.renderFileTag)}
      </div>
    );
  };

  private renderFileTagAvailableList = () => {
    if (!this.state.tag_available_list.length) return null;

    return (
      <div className={Style.Available}>
        <Loader show={this.state.tag_loading}>
          {_.map(this.state.tag_available_list, this.renderFileTag)}
        </Loader>
      </div>
    );
  };

  private renderFileTag = (file_tag: FileTagEntity, index: number = 0) => {
    const current = _.find(this.state.tag_selected_list, entity => entity.getPrimaryKey() === file_tag.getPrimaryKey());

    return (
      <div key={index} className={Style.Tag} onClick={current ? this.eventTagRemove : this.eventTagAdd}>
        <Icon className={Style.Icon} type={current ? IconType.REMOVE : IconType.ADD}/>
        <span className={Style.Text}>{file_tag.name} ({file_tag.size})</span>
      </div>
    );
  };

  private readonly eventElementBrowserDelete = async () => {
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

  private readonly eventFileCreateClick = (file_list: FileList | File[] = []) => {
    if (!this.context.hasPermission(PermissionLevel.FILE_CREATE)) return;

    Dialog.show(
      DialogListenerType.GLOBAL,
      DialogPriority.NEXT,
      (
        <ElementDialog onClose={this.searchFile}>
          <FileUploadForm file_list={_.values(file_list)} file_tag_list={this.state.tag_selected_list}/>
        </ElementDialog>
      ),
    );
  };

  private readonly eventElementBrowserContextMenu = (selected: boolean[]): {[key: string]: ContextMenuItem} => {
    return {
      "open":     {text: "Edit", action: this.eventElementBrowserContextMenuOpen},
      "share":    {icon: IconType.SHARE, text: "Share", action: () => {}},
      "delete":   {icon: IconType.BIN, text: "Delete", action: () => {}},
      "download": {icon: IconType.DOWNLOAD, text: "Download", action: this.eventElementBrowserContextMenuDownload},
    };
  };

  private readonly eventElementBrowserContextMenuOpen = () => {
    for (let index in this.state.file_selected) {
      if (!this.state.file_selected[index]) continue;
      const delay = 500;
      setTimeout(() => {
        console.log("Opening:", `${location.href}/${this.state.file_list[index].id}`, "after a", (+index - 1) * delay, "delay");
        window.open(`${location.href}/${this.state.file_list[index].id}`, "_self");
      }, (+index - 1) * delay);
    }
  };

  private readonly eventElementBrowserContextMenuDownload = async () => {
    const token = await FileEntity.requestDownload(_.filter(this.state.file_list, (entity, key) => this.state.file_selected[key]));
    await FileEntity.confirmDownload(token);
  };

}

type SortOrder = Pick<FileEntity, "name" | "size" | "time_created">

export interface FileBrowserProps {
  className?: string
}

interface State {
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

  pagination_current: number
  pagination_total: number
}
