import React from "react";
import {v4} from "uuid";
import PageBlockType from "../../../common/enums/PageBlockType";
import RichTextDecoration, {RichTextDecorationObject} from "../../classes/RichText/RichTextDecoration";
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
import EditText, {EditTextSelection} from "../Text/EditText";
import Component from "./Component";
import Conditional from "./Conditional";
import Dialog from "./Dialog";
import Style from "./PageExplorer.module.scss";
import ImageBlock from "../Block/ImageBlock";
import Util from "../../../common/services/Util";

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
      decoration: PageExplorer.createDecoration(),
    };
  }

  private static createDecoration() {
    return new RichTextDecoration({
      font_family: Helper.FontFamilyList[7],
      font_length: Helper.FontLengthList[0],
      font_size:   Helper.FontSizeList[5],
    });
  }

  public decorate = (decoration: Initializer<RichTextDecoration>) => {
    this.state.text?.decorate(decoration);
    this.setState({decoration: new RichTextDecoration({...this.state.decoration, ...decoration})});
  };

  public render() {
    const {readonly = true, className, entity} = this.props;
    const {edit, text} = this.state;
    const {decoration: {font_size, font_family, font_length}} = this.state;

    const classes = [Style.Component];
    if (className) classes.push(className);
    if (edit) classes.push(Style.Edit);
    if (readonly) classes.push(Style.Readonly);

    const font_size_index = Helper.FontSizeList.findIndex(value => value === font_size);
    const font_family_index = Helper.FontFamilyList.findIndex(value => value === font_family);
    const font_length_index = Helper.FontLengthList.findIndex(value => value === font_length);

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
                            onChange={this.eventFontFamilyChange} onInputChange={this.eventFontFamilyInput} onIndexChange={this.eventFontFamilyIndex} onReset={this.eventFontFamilyReset}>
                {Helper.FontFamilyList}
              </AutoComplete>

              <div className={Style.FontSizeCombine}>
                <AutoComplete className={Style.FontSize} label={"Size"} value={font_size} index={font_size_index}
                              onChange={this.eventFontSizeChange} onInputChange={this.eventFontSizeInput} onIndexChange={this.eventFontSizeIndex} onReset={this.eventFontSizeReset}>
                  {Helper.FontSizeList}
                </AutoComplete>

                <AutoComplete className={Style.FontLength} label={""} value={font_length} index={font_length_index}
                              onChange={this.eventFontLengthChange} onInputChange={this.eventFontLengthInput} onIndexChange={this.eventFontLengthIndex} onReset={this.eventFontLengthReset}>
                  {Helper.FontLengthList}
                </AutoComplete>
              </div>

              <Button icon={IconType.COLOR_BUCKET}/>
              <Button icon={IconType.FONT}/>
            </div>

            <div className={Style.Right}>
              <Button className={Style.ButtonEdit} icon={edit ? IconType.FILE_DOCUMENT : IconType.EDIT} onClick={this.eventEditModeClick}/>
            </div>
          </Conditional>
        </div>

        <div className={Style.BlockList}>
          {entity.page_block_list.map(this.renderBlock)}
        </div>

        <Conditional condition={edit}>
          <div className={Style.BlockBar}>
            <Button value={PageBlockType.TEXT} icon={IconType.PLUS} onClick={this.eventBlockAddClick}>Text</Button>
            <Button value={PageBlockType.TABLE} icon={IconType.PLUS} onClick={this.eventBlockAddClick}>Table</Button>
            <Button value={PageBlockType.HEADER} icon={IconType.PLUS} onClick={this.eventBlockAddClick}>Header</Button>
            <Button value={PageBlockType.LIST} icon={IconType.PLUS} onClick={this.eventBlockAddClick}>List</Button>
            <Button value={PageBlockType.IMAGE} icon={IconType.PLUS} onClick={this.eventBlockAddClick}>Image</Button>
          </div>
        </Conditional>
      </div>
    );
  }

  private readonly renderDecorationButton = (key: keyof RichTextDecorationObject, icon: IconType) => {
    const {decoration, text} = this.state;

    const value = {[key]: !decoration[key]};
    const disabled = text?.isDecorationDisabled(key);

    const classes = [Style.Button];
    if (decoration[key]) classes.push(Style.Active);

    return (
      <Button className={classes.join(" ")} value={value} icon={icon} disabled={disabled} onClick={this.decorate} onMouseDown={this.eventDecorateMouseDown}/>
    );
  };

  private readonly renderBlock = (block: PageBlockEntity) => {
    return (
      <div key={block.id} className={Style.Block}>
        <Conditional condition={this.state.edit}>
          <div className={Style.BlockHandle}/>
        </Conditional>
        {this.renderPageBlock(block)}
        <Conditional condition={this.state.edit}>
          <div className={Style.BlockActionList}>
            <Button icon={IconType.CLOSE}/>
          </div>
        </Conditional>
      </div>
    );
  };

  private readonly renderPageBlock = (block: PageBlockEntity) => {
    return React.createElement(PageExplorer.block_map[block.type], {
      block,
      decoration:         this.state.decoration,
      readonly:           !this.state.edit,
      className:          Style.PageBlock,
      onPageBlockChange:  this.eventPageBlockChange,
      onDecorationChange: this.eventDecorationChange,
      onEditTextChange:   this.eventEditTextChange,
    });
  };

  private readonly eventFontFamilyChange = (index: number, font_family: string) => this.decorate({font_family});
  private readonly eventFontSizeChange = (index: number, font_size: string) => this.decorate({font_size});
  private readonly eventFontLengthChange = (index: number, font_length: string) => this.decorate({font_length});

  private readonly eventFontFamilyReset = () => this.decorate({font_family: this.state.decoration.font_family});
  private readonly eventFontSizeReset = () => this.decorate({font_family: this.state.decoration.font_family});
  private readonly eventFontLengthReset = () => this.decorate({font_family: this.state.decoration.font_family});

  private readonly eventFontFamilyInput = (font_family: string) => this.state.text?.decorate({...this.state.decoration, font_family});
  private readonly eventFontSizeInput = (font_size: string) => this.state.text?.decorate({...this.state.decoration, font_size});
  private readonly eventFontLengthInput = (font_length: string) => this.state.text?.decorate({...this.state.decoration, font_length});

  private readonly eventFontFamilyIndex = (index: number) => this.state.text?.decorate({...this.state.decoration, font_family: Helper.FontFamilyList[index]});
  private readonly eventFontSizeIndex = (index: number) => this.state.text?.decorate({...this.state.decoration, font_size: Helper.FontSizeList[index]});
  private readonly eventFontLengthIndex = (index: number) => this.state.text?.decorate({...this.state.decoration, font_length: Helper.FontLengthList[index]});

  private readonly eventEditModeClick = () => {
    this.setState({edit: !this.state.edit});
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

  private readonly eventDecorateMouseDown = (property: Initializer<RichTextDecoration>, event: React.MouseEvent) => {
    event.preventDefault();
  };

  private readonly eventBlockAddClick = (type: PageBlockType) => {
    const page_block_list = [...this.props.entity.page_block_list, new PageBlockEntity({id: v4(), type})];
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));
  };

  private readonly eventPageBlockChange = (block: PageBlockEntity) => {
    const index = this.props.entity.page_block_list.findIndex(value => value.getPrimaryID() === block.getPrimaryID());
    const offset = index < 0 ? this.props.entity.page_block_list.length : index;

    this.props.onChange(new PageEntity({...this.props.entity, page_block_list: Util.arrayReplace(this.props.entity.page_block_list, offset, block)}));
  };

  private readonly eventDecorationChange = (decoration?: RichTextDecoration) => {
    this.setState({decoration: decoration ?? PageExplorer.createDecoration()});
  };

  private readonly eventEditTextChange = (text?: EditText) => {
    this.setState({text});
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

export interface PageExplorerBlockState {
  selection: EditTextSelection;
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
