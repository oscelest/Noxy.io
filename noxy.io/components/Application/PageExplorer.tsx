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
import DragSortList from "../Base/DragSortList";
import DropdownButton from "../UI/DropdownButton";
import ColorPicker from "../Form/ColorPicker";
import Color from "../../../common/classes/Color";

export default class PageExplorer extends Component<PageExplorerProps, State> {

  private static font_size_list: string[] = ["", ...Helper.FontSizeList];
  private static font_family_list: string[] = ["", ...Helper.FontFamilyList];
  private static block_map: { [K in PageBlockType]: React.ComponentClass<PageExplorerBlockProps> } = {
    [PageBlockType.LIST]:   ListBlock,
    [PageBlockType.TEXT]:   TextBlock,
    [PageBlockType.TABLE]:  TableBlock,
    [PageBlockType.IMAGE]:  ImageBlock,
    [PageBlockType.HEADER]: HeaderBlock,
  };

  constructor(props: PageExplorerProps) {
    super(props);
    this.state = {
      edit:       true,
      decoration: new RichTextDecoration({
        font_size:   "",
        font_family: "",
      }),
    };
  }

  public decorate(value: Initializer<RichTextDecoration>) {
    if (this.state.text) {
      this.state.text?.focus();
      this.state.text?.decorate(value);
    }
    else {
      this.setState({decoration: new RichTextDecoration(value)});
    }
  };

  public componentDidMount(): void {
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list: this.props.entity.page_block_list.sort((a, b) => a.weight - b.weight)}));
  }

  public render() {
    const {readonly = true, className, entity} = this.props;
    const {edit, text} = this.state;
    const {decoration: {font_family = "", font_size = "", color = new Color("#FFFFFFFF"), background_color = new Color("#00000000")}} = this.state;

    const classes = [Style.Component];
    if (className) classes.push(className);
    if (edit) classes.push(Style.Edit);
    if (readonly) classes.push(Style.Readonly);

    const font_size_index = PageExplorer.font_size_list.findIndex(value => value === font_size);
    const font_family_index = PageExplorer.font_family_list.findIndex(value => value === font_family);

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
              <AutoComplete className={Style.FontFamily} label={"Font"} value={font_family} index={font_family_index} strict={true}
                            onChange={this.eventFontFamilyChange} onInputChange={this.eventFontFamilyPreview} onIndexChange={this.eventFontFamilyPreview} onReset={this.eventReset}>
                {PageExplorer.font_family_list}
              </AutoComplete>

              <AutoComplete className={Style.FontSize} label={"Size"} value={font_size} index={font_size_index}
                            onChange={this.eventFontSizeChange} onInputChange={this.eventFontSizePreview} onIndexChange={this.eventFontSizePreview} onReset={this.eventReset}>
                {PageExplorer.font_size_list}
              </AutoComplete>

              <DropdownButton icon={IconType.COLOR_BUCKET}>
                <ColorPicker value={background_color} onChange={this.eventBackgroundColorChange}/>
              </DropdownButton>
              <DropdownButton icon={IconType.FONT}>
                <ColorPicker value={color} onChange={this.eventColorChange}/>
              </DropdownButton>
            </div>

            <div className={Style.Right}>
              <Button className={Style.ButtonEdit} icon={edit ? IconType.FILE_DOCUMENT : IconType.EDIT} onClick={this.eventEditModeClick}/>
            </div>
          </Conditional>
        </div>

        <Conditional condition={edit}>
          <DragSortList list={this.props.entity.page_block_list} onChange={this.eventPageBlockListChange} onRender={this.renderPageBlock} onKey={this.eventPageBlockListKey}/>
        </Conditional>
        <Conditional condition={!edit}>
          <div className={Style.BlockList}>
            {entity.page_block_list.map(this.renderBlock)}
          </div>
        </Conditional>

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
    const {decoration, text} = this.state;

    const object = {[key]: !decoration[key]};
    const disabled = text?.isDecorationDisabled(key);

    const classes = [Style.Button];
    if (decoration[key]) classes.push(Style.Active);

    return (
      <Button className={classes.join(" ")} value={object} icon={icon} disabled={disabled}
              onClick={this.eventDecorateButtonClick} onMouseDown={this.eventDecorateButtonMouseDown}/>
    );
  };

  private readonly renderBlock = (block: PageBlockEntity, index: number = 0) => {
    return (
      <div key={block.id} className={Style.Block}>
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
      className:          Style.PageBlock,
      readonly:           !this.state.edit,
      decoration:         this.state.decoration,
      onPageBlockChange:  this.eventPageBlockChange,
      onDecorationChange: this.eventDecorationChange,
      onEditTextChange:   this.eventEditTextChange,
    });
  };

  private readonly eventFontFamilyPreview = (value: string | number) => {
    this.state.text?.preview({...this.state.decoration, font_family: typeof value === "string" ? value : PageExplorer.font_family_list[value]});
  };

  private readonly eventFontFamilyChange = (font_family: string) => {
    this.decorate({...this.state.decoration, font_family});
    this.state.text?.focus();
  };

  private readonly eventFontSizePreview = (value: string | number) => {
    this.state.text?.preview({...this.state.decoration, font_size: typeof value === "string" ? value : PageExplorer.font_size_list[value]});
  };

  private readonly eventFontSizeChange = (font_size: string) => {
    this.decorate({...this.state.decoration, font_size});
    this.state.text?.focus();
  };

  private readonly eventReset = () => {
    this.state.text?.preview();
    this.state.text?.focus();
  };

  private readonly eventBackgroundColorChange = (background_color: Color) => {
    this.decorate({...this.state.decoration, background_color});
  };

  private readonly eventColorChange = (color: Color) => {
    this.decorate({...this.state.decoration, color});
  };

  private readonly eventEditModeClick = () => this.setState({edit: !this.state.edit});

  private readonly eventDecorateButtonClick = (decoration: Initializer<RichTextDecoration>) => this.decorate({...this.state.decoration, ...decoration});
  private readonly eventDecorateButtonMouseDown = (property: Initializer<RichTextDecoration>, event: React.MouseEvent) => event.preventDefault();

  private readonly eventPageBlockListKey = (page_block: PageBlockEntity) => page_block.getPrimaryID();
  private readonly eventPageBlockListChange = (page_block_list: PageBlockEntity[]) => {
    page_block_list.forEach((block, index) => block.weight = index);
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));
  };

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

  private readonly eventDecorationChange = (decoration: RichTextDecoration) => {
    this.setState({decoration});
  };
  private readonly eventEditTextChange = (text?: EditText) => this.setState({text});

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
  className?: string;

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

  text?: EditText;
  decoration: RichTextDecoration;
}
