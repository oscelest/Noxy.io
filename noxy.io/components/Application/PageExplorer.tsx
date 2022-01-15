import React from "react";
import {v4} from "uuid";
import PageBlockType from "../../../common/enums/PageBlockType";
import RichTextDecoration, {RichTextDecorationBooleanKeys} from "../../classes/RichText/RichTextDecoration";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import PageEntity from "../../entities/Page/PageEntity";
import IconType from "../../enums/IconType";
import Helper from "../../Helper";
import HeaderBlock from "../Block/HeaderBlock";
import ListBlock from "../Block/ListBlock";
import TableBlock from "../Block/TableBlock";
import TextBlock from "../Block/TextBlock";
import AutoComplete from "../Form/AutoComplete";
import Button from "../Form/Button";
import Input from "../Form/Input";
import EditText from "../Text/EditText";
import Component from "./Component";
import Conditional from "./Conditional";
import Dialog from "./Dialog";
import Style from "./PageExplorer.module.scss";
import ImageBlock from "../Block/ImageBlock";
import Util from "../../../common/services/Util";
import Point from "../../classes/Point";
import FatalException from "exceptions/FatalException";
import Rect from "../../classes/Rect";

export default class PageExplorer extends Component<PageExplorerProps, State> {

  private static block_map: { [K in PageBlockType]: React.ComponentClass<PageExplorerBlockProps> } = {
    [PageBlockType.HEADER]: HeaderBlock,
    [PageBlockType.IMAGE]:  ImageBlock,
    [PageBlockType.TABLE]:  TableBlock,
    [PageBlockType.TEXT]:   TextBlock,
    [PageBlockType.LIST]:   ListBlock,
  };

  constructor(props: PageExplorerProps) {
    super(props);
    this.state = {
      edit:       true,
      ref_drag:   React.createRef(),
      ref_list:   React.createRef(),
      decoration: new RichTextDecoration({
        font_family: Helper.FontFamilyDefault,
        font_size:   Helper.FontSizeDefault,
      }),
    };
  }

  public decorate(value?: Initializer<RichTextDecoration>) {
    this.setState({preview: undefined});
    this.state.text?.focus();
    this.state.text?.decorate({...this.state.decoration, ...value});
  };

  public preview(value: Initializer<RichTextDecoration>) {
    const preview = new RichTextDecoration({...this.state.preview ?? this.state.decoration, ...value});
    this.setState({preview});
    this.state.text?.decorate(preview);
  }

  private getDragStyle(): React.CSSProperties {
    const {drag_origin, drag_target} = this.state;
    if (!drag_origin || !drag_target) throw new FatalException("Cannot dragged element's style with no origin and target point.");
    return {left: `${drag_target.x - drag_origin.x}px`, top: `${drag_target.y - drag_origin.y}px`, zIndex: 100};
  };

  public componentDidMount(): void {
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list: this.props.entity.page_block_list.sort((a, b) => a.weight - b.weight)}));
  }

  public render() {
    const {readonly = true, className, entity} = this.props;
    const {edit, text, decoration, ref_list} = this.state;
    const {preview: {font_family = decoration.font_family ?? Helper.FontFamilyDefault, font_size = decoration.font_size ?? Helper.FontSizeDefault} = {}} = this.state;

    const classes = [Style.Component];
    if (className) classes.push(className);
    if (edit) classes.push(Style.Edit);
    if (readonly) classes.push(Style.Readonly);

    const font_family_index = Helper.FontFamilyList.findIndex(value => value === font_family);
    const font_size_index = Helper.FontSizeList.findIndex(value => value === font_size);

    return (
      <div className={classes.join(" ")}>
        <div className={Style.Toolbar}>
          <Conditional condition={!readonly}>
            <div className={Style.Left}>
              {this.renderDecorationButton("bold", IconType.BOLD)}
              {this.renderDecorationButton("italic", IconType.ITALIC)}
              {this.renderDecorationButton("strikethrough", IconType.STRIKE_THROUGH)}
              {this.renderDecorationButton("underline", IconType.UNDERLINE)}
              {this.renderDecorationButton("code", IconType.CODE_ALT)}
              {this.renderDecorationButton("mark", IconType.MARKER)}

              <Button icon={IconType.CERTIFICATE} disabled={text?.isDecorationDisabled("link")} onClick={this.eventDecorateLinkClick}/>
            </div>

            <div className={Style.Font}>
              <AutoComplete className={Style.FontFamily} label={"Font"} value={font_family} index={font_family_index}
                            onChange={this.eventFontFamilyChange} onInputChange={this.eventFontFamilyInput} onReset={this.eventPreviewReset}>
                {Helper.FontFamilyList}
              </AutoComplete>

              <AutoComplete className={Style.FontSize} label={"Size"} value={font_size} index={font_size_index}
                            onChange={this.eventFontSizeChange} onInputChange={this.eventFontSizeInput} onReset={this.eventPreviewReset}>
                {Helper.FontSizeList}
              </AutoComplete>

              <Button icon={IconType.COLOR_BUCKET}/>
              <Button icon={IconType.FONT}/>
            </div>

            <div className={Style.Right}>
              <Button className={Style.ButtonEdit} icon={edit ? IconType.FILE_DOCUMENT : IconType.EDIT} onClick={this.eventEditModeClick}/>
            </div>
          </Conditional>
        </div>

        <div ref={ref_list} className={Style.BlockList}>
          {entity.page_block_list.map(this.renderBlock)}
        </div>

        <Conditional condition={edit}>
          <div className={Style.BlockBar}>
            <Button value={PageBlockType.TEXT} icon={IconType.PLUS} onClick={this.eventPageBlockAddClick}>Text</Button>
            <Button value={PageBlockType.TABLE} icon={IconType.PLUS} onClick={this.eventPageBlockAddClick}>Table</Button>
            <Button value={PageBlockType.HEADER} icon={IconType.PLUS} onClick={this.eventPageBlockAddClick}>Header</Button>
            <Button value={PageBlockType.LIST} icon={IconType.PLUS} onClick={this.eventPageBlockAddClick}>List</Button>
            <Button value={PageBlockType.IMAGE} icon={IconType.PLUS} onClick={this.eventPageBlockAddClick}>Image</Button>
          </div>
        </Conditional>
      </div>
    );
  }

  private readonly renderDecorationButton = (key: RichTextDecorationBooleanKeys, icon: IconType) => {
    const {preview, decoration, text} = this.state;

    const object = {[key]: preview?.[key] !== undefined ? !preview[key] : !decoration[key]};
    const disabled = text?.isDecorationDisabled(key);

    const classes = [Style.Button];
    if (decoration[key]) classes.push(Style.Active);

    return (
      <Button className={classes.join(" ")} value={object} icon={icon} disabled={disabled}
              onClick={this.eventDecorateButtonClick} onMouseDown={this.eventDecorateButtonMouseDown}/>
    );
  };

  private readonly renderBlock = (block: PageBlockEntity, index: number = 0) => {
    const drag = this.state.drag_id === block.getPrimaryID();
    const ref = drag ? this.state.ref_drag : undefined;
    const style = drag ? this.getDragStyle() : undefined;

    return (
      <div key={block.id} ref={ref} className={Style.Block} data-index={index} style={style}>
        <Conditional condition={this.state.edit}>
          <div className={Style.BlockHandle} data-id={block.id} onMouseDown={this.eventDragMouseDown}/>
        </Conditional>
        {this.renderPageBlock(block)}
        <Conditional condition={this.state.edit}>
          <div className={Style.BlockActionList}>
            <Button value={index} icon={IconType.CLOSE} onClick={this.eventPageBlockRemove}/>
          </div>
        </Conditional>
      </div>
    );
  };

  private readonly renderPageBlock = (block: PageBlockEntity) => {
    return React.createElement(PageExplorer.block_map[block.type], {
      block,
      decoration:         this.state.preview ?? this.state.decoration,
      readonly:           !this.state.edit,
      className:          Style.PageBlock,
      onPageBlockChange:  this.eventPageBlockChange,
      onDecorationChange: this.eventDecorationChange,
      onEditTextChange:   this.eventEditTextChange,
    });
  };


  private readonly eventDragMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const next_state = {} as State;
    const element = event.currentTarget;

    next_state.drag_origin = new Point(event.pageX, event.pageY);
    next_state.drag_target = next_state.drag_origin;
    next_state.drag_id = element.getAttribute("data-id") ?? "";
    if (!next_state.drag_id) throw new FatalException("Attempting to drag PageBlock element while handle has no ID.");

    const {left, top} = element.getBoundingClientRect();
    next_state.drag_offset = new Point(next_state.drag_origin.x - left, next_state.drag_origin.y - top);

    this.setState(next_state);

    window.addEventListener("mousemove", this.eventDragMouseMove);
    window.addEventListener("mouseup", this.eventDragMouseUp);

    event.preventDefault();
  };

  private readonly eventDragMouseMove = (event: MouseEvent) => {
    const {drag_origin, drag_offset, ref_drag: {current: source_element}} = this.state;
    if (!drag_origin || !drag_offset || !source_element) return;

    const children = this.state.ref_list.current?.children;
    if (!children) throw new FatalException("Could not get list of PageBlock elements.");

    const drag_target = new Point(event.pageX, event.pageY);
    for (let i = 0; i < children.length; i++) {
      const target_element = children.item(i);
      if (!target_element) continue;

      const target_rect = Rect.fromDOMRect(target_element.getBoundingClientRect());
      const target_index_attr = target_element.getAttribute("data-index");
      if (target_element === source_element || !target_rect.containsPoint(drag_target) || !target_index_attr) continue;

      const target_index = +target_index_attr;
      if (isNaN(+target_index) || +target_index < 0 || +target_index >= this.props.entity.page_block_list.length) throw new FatalException("Target PageBlock element index is invalid.");

      const source_index_attr = source_element.getAttribute("data-index");
      if (!source_index_attr) throw new FatalException("Could not get source PageBlock element index during Drag Event.");

      const source_index = +source_index_attr;
      if (isNaN(+source_index) || +source_index < 0 || +source_index >= this.props.entity.page_block_list.length) throw new FatalException("Source PageBlock element index is invalid.");

      const page_block_list = [...this.props.entity.page_block_list];
      page_block_list.splice(source_index, 1);
      page_block_list.splice(target_index, 0, this.props.entity.page_block_list[source_index]);
      page_block_list.forEach((block, index) => block.weight = index);
      this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));

      const drag_origin = new Point(target_rect.x + drag_offset.x, target_rect.y + drag_offset.y);
      return this.setState({drag_target, drag_origin});
    }

    this.setState({drag_target});
  };

  private readonly eventDragMouseUp = () => {
    this.setState({drag_target: undefined, drag_origin: undefined, drag_offset: undefined, drag_id: undefined});
    window.removeEventListener("mousemove", this.eventDragMouseMove);
    window.removeEventListener("mouseup", this.eventDragMouseUp);
  };

  private readonly eventFontFamilyChange = (index: number, font_family: string) => this.decorate({font_family});
  private readonly eventFontSizeChange = (index: number, font_size: string) => this.decorate({font_size});

  private readonly eventFontFamilyInput = (font_family: string) => this.preview({font_family});
  private readonly eventFontSizeInput = (font_size: string) => this.preview({font_size});

  private readonly eventPreviewReset = () => this.decorate();

  private readonly eventEditModeClick = () => this.setState({edit: !this.state.edit});

  private readonly eventDecorateButtonClick = (decoration: Initializer<RichTextDecoration>) => this.decorate(decoration);
  private readonly eventDecorateButtonMouseDown = (property: Initializer<RichTextDecoration>, event: React.MouseEvent) => event.preventDefault();

  private readonly eventPageBlockRemove = (index: number) => {
    const page_block_list = [...this.props.entity.page_block_list];
    page_block_list.splice(index, 1);
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));
  };

  private readonly eventPageBlockAddClick = (type: PageBlockType) => {
    const page_block_list = [...this.props.entity.page_block_list, new PageBlockEntity({id: v4(), type, weight: this.props.entity.page_block_list.length})];
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));
  };

  private readonly eventPageBlockChange = (block: PageBlockEntity) => {
    const index = this.props.entity.page_block_list.findIndex(value => value.getPrimaryID() === block.getPrimaryID());
    const offset = index < 0 ? this.props.entity.page_block_list.length : index;

    this.props.onChange(new PageEntity({...this.props.entity, page_block_list: Util.arrayReplace(this.props.entity.page_block_list, offset, block)}));
  };

  private readonly eventDecorationChange = (decoration?: RichTextDecoration) => {
    if (this.state.preview) {
      this.setState({preview: new RichTextDecoration({...this.state.preview, ...decoration})});
    }
    else {
      this.setState({decoration: new RichTextDecoration({...this.state.decoration, ...decoration})});
    }
  };

  private readonly eventEditTextChange = (text?: EditText) => {
    this.setState({text});
  };

  private readonly eventDecorateLinkClick = () => {
    if (!this.state.text) return;
    this.setState({
      dialog: Dialog.show(
        <div>
          <Input label={"Link"} value={"https://dr.dk"} onChange={() => {}}/>
          <Button value={"https://dr.dk"} onClick={this.eventDecorateLinkSubmit}>Add</Button>
        </div>,
        {
          title:   "Add link",
          overlay: true,
        },
      ),
    });
  };

  private readonly eventDecorateLinkSubmit = (value: string) => {
    // const element = document.createElement("a");
    // const link = document.createElement("u");
    // element.href = value;
    // link.innerText = value;
    // element.append(link);
    // this.state.focus?.insertHTML(element);
  };
}

export interface PageExplorerBlockProps<Content = any> {
  readonly: boolean;
  className: string;

  block: PageBlockEntity<Content>;
  decoration: RichTextDecoration;

  onEditTextChange(text: EditText): void;
  onPageBlockChange(block: PageBlockEntity<Content>): void;
  onDecorationChange(decoration?: RichTextDecoration): void;
}

export interface PageExplorerProps {
  readonly?: boolean;
  className?: string;

  entity: PageEntity;
  onChange(entity: PageEntity): void;
}

interface State {
  edit: boolean;
  dialog?: string;

  ref_list: React.RefObject<HTMLDivElement>;
  ref_drag: React.RefObject<HTMLDivElement>;

  drag_id?: string;
  drag_target?: Point;
  drag_origin?: Point;
  drag_offset?: Point;

  text?: EditText;
  preview?: RichTextDecoration;
  decoration: RichTextDecoration;
}
