import React from "react";
import PageBlockType from "../../../common/enums/PageBlockType";
import Decoration from "../../classes/Decoration";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import PageEntity from "../../entities/Page/PageEntity";
import IconType from "../../enums/IconType";
import Helper from "../../Helper";
import HeaderBlock from "../Block/HeaderBlock";
import TableBlock from "../Block/TableBlock";
import TextBlock from "../Block/TextBlock";
import AutoComplete from "../Form/AutoComplete";
import Button from "../Form/Button";
import Input from "../Form/Input";
import EditText, {Selection} from "../Text/EditText";
import Component from "./Component";
import Conditional from "./Conditional";
import Dialog from "./Dialog";
import Style from "./PageExplorer.module.scss";

export default class PageExplorer extends Component<PageExplorerProps, State> {
  
  constructor(props: PageExplorerProps) {
    super(props);
    this.state = {
      edit:       true,
      text_color: false,
      decoration: new Decoration(),
    };
  }
  
  private readonly addBlock = (block: PageBlockEntity) => {
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list: [...this.props.entity.page_block_list, block]}));
  };
  
  private readonly getBlockComponent = (type: PageBlockType) => {
    switch (type) {
      case PageBlockType.TEXT:
        return TextBlock;
      case PageBlockType.TABLE:
        return TableBlock;
      case PageBlockType.HEADER:
        return HeaderBlock;
      default:
        throw "Type has no component.";
    }
  };
  
  private readonly isReadonly = () => {
    return this.props.readonly ?? true;
  };
  
  private readonly eventFontFamilyChange = (index: number) => {
    const font_family = Helper.FontFamilyList[index] ?? this.state.decoration.font_family;
    this.state.focus?.decorate({font_family});
    this.setState({decoration: new Decoration({...this.state.decoration, font_family})});
  };
  
  private readonly eventFontFamilyIndex = (index: number) => {
    this.state.focus?.decorate({font_family: Helper.FontFamilyList[index]});
  };
  
  private readonly eventFontFamilyReset = () => {
    this.state.focus?.decorate({font_family: this.state.decoration.font_family});
  };
  
  private readonly eventFontSizeChange = (index: number, font_size: string) => {
    this.state.focus?.decorate({font_size});
    this.setState({decoration: new Decoration({...this.state.decoration, font_size})});
  };
  
  private readonly eventFontSizeIndex = (index: number) => {
    this.state.focus?.decorate({font_size: Helper.FontSizeList[index]});
  };
  
  private readonly eventFontSizeReset = () => {
    this.state.focus?.decorate({font_size: this.state.decoration.font_size});
  };
  
  private readonly eventFontLengthChange = (index: number, font_length: string) => {
    this.state.focus?.decorate({font_length});
    this.setState({decoration: new Decoration({...this.state.decoration, font_length})});
  };
  
  private readonly eventFontLengthIndex = (index: number) => {
    this.state.focus?.decorate({font_length: Helper.FontLengthList[index]});
  };
  
  private readonly eventFontLengthReset = () => {
    this.state.focus?.decorate({font_length: this.state.decoration.font_length});
  };
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    if (this.props.readonly ?? true) classes.push(Style.Readonly);
    
    const font_size_value = this.state.decoration.font_size;
    const font_family_value = this.state.decoration.font_family;
    const font_length_value = this.state.decoration.font_length;
    
    const font_size_index = Helper.FontSizeList.findIndex(value => value === this.state.decoration.font_size);
    const font_family_index = Helper.FontFamilyList.findIndex(value => value === this.state.decoration.font_family);
    const font_length_index = Helper.FontLengthList.findIndex(value => value === this.state.decoration.font_length);
    
    return (
      <div className={classes.join(" ")}>
        <div className={Style.Toolbar}>
          <Conditional condition={!this.isReadonly()}>
            <div className={Style.Left}>
              <Button value={{bold: !this.state.decoration.bold}} icon={IconType.BOLD} disabled={this.state.focus?.isDecorationDisabled("bold")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button value={{italic: !this.state.decoration.italic}} icon={IconType.ITALIC} disabled={this.state.focus?.isDecorationDisabled("italic")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button value={{strikethrough: !this.state.decoration.strikethrough}} icon={IconType.STRIKE_THROUGH} disabled={this.state.focus?.isDecorationDisabled("strikethrough")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button value={{underline: !this.state.decoration.underline}} icon={IconType.UNDERLINE} disabled={this.state.focus?.isDecorationDisabled("underline")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button value={{code: !this.state.decoration.code}} icon={IconType.CODE_ALT} disabled={this.state.focus?.isDecorationDisabled("code")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button value={{mark: !this.state.decoration.mark}} icon={IconType.MARKER} disabled={this.state.focus?.isDecorationDisabled("mark")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button icon={IconType.CERTIFICATE} disabled={this.state.focus?.isDecorationDisabled("link")}
                      onClick={this.eventDecorateLinkClick}/>
            </div>
            
            <div className={Style.Font}>
              <AutoComplete className={Style.FontFamily} label={"Font"} value={font_family_value} index={font_family_index}
                            onChange={this.eventFontFamilyChange} onIndexChange={this.eventFontFamilyIndex} onReset={this.eventFontFamilyReset}>
                {Helper.FontFamilyList}
              </AutoComplete>
              
              <div className={Style.FontSizeCombine}>
                <AutoComplete className={Style.FontSize} label={"Size"} value={font_size_value} index={font_size_index}
                              onChange={this.eventFontSizeChange} onIndexChange={this.eventFontSizeIndex} onReset={this.eventFontSizeReset}>
                  {Helper.FontSizeList}
                </AutoComplete>
                
                <AutoComplete className={Style.FontLength} label={""} value={font_length_value} index={font_length_index}
                              onChange={this.eventFontLengthChange} onIndexChange={this.eventFontLengthIndex} onReset={this.eventFontLengthReset}>
                  {Helper.FontLengthList}
                </AutoComplete>
              </div>
              
              <Button icon={IconType.COLOR_BUCKET}/>
              <Button icon={IconType.FONT}/>
            </div>
            
            
            <div className={Style.Right}>
              <Button className={Style.ButtonEdit} icon={this.state.edit ? IconType.FILE_DOCUMENT : IconType.EDIT} onClick={this.eventEditModeClick}/>
            </div>
          </Conditional>
        </div>
        
        <div className={Style.BlockList}>
          {this.props.entity.page_block_list.map(this.renderBlock)}
        </div>
        
        <Conditional condition={this.state.edit}>
          <div className={Style.BlockBar}>
            <Button value={PageBlockType.TEXT} icon={IconType.PLUS} onClick={this.eventBlockAddClick}>Text</Button>
            <Button value={PageBlockType.TABLE} icon={IconType.PLUS} onClick={this.eventBlockAddClick}>Table</Button>
            <Button value={PageBlockType.HEADER} icon={IconType.PLUS} onClick={this.eventBlockAddClick}>Header</Button>
          </div>
        </Conditional>
      </div>
    );
  }
  
  private readonly renderBlock = (block: PageBlockEntity<PageBlockType>, key: number = 0) => {
    return (
      <div key={key} className={Style.Block}>
        <Conditional condition={this.state.edit}>
          <div className={Style.BlockHandle}/>
        </Conditional>
        {this.renderPageBlock(block)}
        <Conditional condition={this.state.edit}>
          <div className={Style.BlockActionList}>
            <Button value={key} icon={IconType.CLOSE}/>
          </div>
        </Conditional>
      </div>
    );
  };
  
  private readonly renderPageBlock = (block: PageBlockEntity<PageBlockType>) => {
    const element = this.getBlockComponent(block.type) as React.ComponentClass<PageExplorerBlockProps>;
    const props: PageExplorerBlockProps = {
      block,
      readonly:  !this.state.edit,
      className: Style.PageBlock,
      onFocus:   this.eventPageBlockFocus,
      onSelect:  this.eventPageBlockSelect,
      onChange:  this.eventPageBlockChange,
      onSubmit:  this.eventPageBlockSubmit,
    };
    
    return React.createElement(element, props);
  };
  
  private readonly eventEditModeClick = () => {
    this.setState({edit: !this.state.edit});
  };
  
  private readonly eventDecorateClick = (decoration: Initializer<Decoration>) => {
    this.state.focus?.decorate(decoration);
  };
  
  private readonly eventDecorateLinkClick = () => {
    if (!this.state.focus) return;
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
    const element = document.createElement("a");
    const link = document.createElement("u");
    element.href = value;
    link.innerText = value;
    element.append(link);
    this.state.focus?.insertHTML(element);
  };
  
  private readonly eventDecorateMouseDown = (property: Initializer<Decoration>, event: React.MouseEvent) => {
    event.preventDefault();
  };
  
  private readonly eventBlockAddClick = (type: PageBlockType) => {
    this.addBlock(this.getBlockComponent(type).create());
  };
  
  private readonly eventPageBlockFocus = (event: React.FocusEvent<HTMLDivElement>, focus: EditText) => {
    this.setState({focus});
  };
  
  private readonly eventPageBlockSelect = ({start, end}: Selection, component: EditText) => {
    if (start === end) start = Math.max(0, start - 1);
    this.setState({decoration: component.getDecoration(start, end)});
  };
  
  private readonly eventPageBlockChange = (block: PageBlockEntity<PageBlockType>) => {
    const index = this.props.entity.page_block_list.findIndex(value => value.getPrimaryID() === block.getPrimaryID());
    const offset = index < 0 ? this.props.entity.page_block_list.length : index;
    const page_block_list = [...this.props.entity.page_block_list.slice(0, offset), block, ...this.props.entity.page_block_list.slice(offset + 1)];
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));
  };
  
  private readonly eventPageBlockSubmit = (block: PageBlockEntity<PageBlockType>) => {
    const index = this.props.entity.page_block_list.findIndex(value => value.getPrimaryID() === block.getPrimaryID());
    const page_block_list = [...this.props.entity.page_block_list.slice(0, index + 1), this.getBlockComponent(block.type).create(), ...this.props.entity.page_block_list.slice(index + 1)];
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));
  };
}

export interface PageExplorerBlockProps<Type extends PageBlockType = PageBlockType> extends React.PropsWithChildren<any> {
  block: PageBlockEntity<Type>;
  readonly?: boolean;
  className?: string;
  
  onBlur?(event: React.FocusEvent<HTMLDivElement>, component: EditText): void;
  onFocus?(event: React.FocusEvent<HTMLDivElement>, component: EditText): void;
  onSelect?(selection: Selection, component: EditText): void;
  onChange(block: PageBlockEntity<Type>): void;
  onSubmit?(block: PageBlockEntity<Type>): void;
}

export interface PageExplorerProps {
  readonly?: boolean;
  className?: string;
  
  entity: PageEntity;
  onChange(entity: PageEntity): void;
}

interface State {
  edit: boolean;
  focus?: EditText;
  dialog?: string;
  decoration: Decoration;
  
  text_color: boolean;
}


// private readonly eventBlockDownClick = (key: number) => {
//   if (key === this.props.entity.page_block_list.length - 1) return;
//
//   this.props.onChange(
//     new PageEntity({
//       ...this.props.entity,
//       page_block_list: [
//         ...this.props.entity.page_block_list.slice(0, key),
//         this.props.entity.page_block_list[key + 1],
//         this.props.entity.page_block_list[key],
//         ...this.props.entity.page_block_list.slice(key + 2),
//       ],
//     }),
//   );
// };
//
// private readonly eventBlockUpClick = (key: number) => {
//   if (0 === this.props.entity.page_block_list.length - 1) return;
//
//   this.props.onChange(
//     new PageEntity({
//       ...this.props.entity,
//       page_block_list: [
//         ...this.props.entity.page_block_list.slice(0, key - 1),
//         this.props.entity.page_block_list[key],
//         this.props.entity.page_block_list[key - 1],
//         ...this.props.entity.page_block_list.slice(key + 1),
//       ],
//     }),
//   );
// };
