import React from "react";
import PageBlockType from "../../../common/enums/PageBlockType";
import Decoration from "../../classes/Decoration";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import PageEntity from "../../entities/Page/PageEntity";
import IconType from "../../enums/IconType";
import Dropdown from "../Base/Dropdown";
import HeaderBlock from "../Block/HeaderBlock";
import TableBlock from "../Block/TableBlock";
import TextBlock from "../Block/TextBlock";
import Button from "../Form/Button";
import Input from "../Form/Input";
import Component from "./Component";
import Conditional from "./Conditional";
import Style from "./PageExplorer.module.scss";

export default class PageExplorer extends Component<PageExplorerProps, State> {
  
  private static BoldDecoration: Initializer<Decoration> = {bold: true};
  private static ItalicDecoration: Initializer<Decoration> = {italic: true};
  private static MarkDecoration: Initializer<Decoration> = {mark: true};
  private static StrikethroughDecoration: Initializer<Decoration> = {strikethrough: true};
  private static UnderlineDecoration: Initializer<Decoration> = {underline: true};
  private static CodeDecoration: Initializer<Decoration> = {code: true};
  
  constructor(props: PageExplorerProps) {
    super(props);
    this.state = {
      ref:  React.createRef(),
      edit: true,
      
      text_color: false,
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
  }
  
  private readonly eventColorPickerClick = () => {
    this.setState({text_color: !this.state.text_color});
  }
  
  private readonly eventColorPickerChange = (event: React.ChangeEvent) => {
    console.log(event, event.persist());
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    if (this.props.readonly ?? true) classes.push(Style.Readonly);
    
    return (
      <div className={classes.join(" ")}>
        <div className={Style.Toolbar}>
          <Conditional condition={!this.isReadonly()}>
            <div className={Style.Left}>
              <Button value={PageExplorer.BoldDecoration} icon={IconType.BOLD} onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              <Button value={PageExplorer.ItalicDecoration} icon={IconType.ITALIC} onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              <Button value={PageExplorer.StrikethroughDecoration} icon={IconType.STRIKE_THROUGH} onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              <Button value={PageExplorer.UnderlineDecoration} icon={IconType.UNDERLINE} onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              <Button value={PageExplorer.CodeDecoration} icon={IconType.CODE_ALT} onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              <Button value={PageExplorer.MarkDecoration} icon={IconType.MARKER} onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
            </div>
            <div>
              <Button icon={IconType.FONT} onClick={this.eventColorPickerClick}/>
              <Dropdown hidden={!this.state.text_color}>
                <input type={"color"} onChange={this.eventColorPickerChange}/>
              </Dropdown>
            </div>
            <Input label={"Font"} value={"Helvetica"} onChange={() => {}}>
              {["Helvetica", "Nunito"]}
            </Input>
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
    const element = this.getBlockComponent(block.type) as React.ComponentClass<DefaultBlockProps>;
    const props: DefaultBlockProps = {
      block,
      ref:       this.state.focus?.id === block.id ? this.state.ref : null,
      readonly:  !this.state.edit,
      className: Style.PageBlock,
      onFocus:   this.eventPageBlockFocus,
      onChange:  this.eventPageBlockChange,
      onSubmit:  this.eventPageBlockSubmit,
    };
    
    return React.createElement(element, props);
  };
  
  private readonly eventEditModeClick = () => {
    this.setState({edit: !this.state.edit});
  };
  
  private readonly eventDecorateClick = (decoration: Initializer<Decoration>) => {
    if (this.state.ref.current && this.state.focus) this.state.ref.current.decorate(decoration);
  };
  
  private readonly eventDecorateMouseDown = (decoration: Initializer<Decoration>, event: React.MouseEvent) => {
    event.preventDefault();
  };
  
  private readonly eventBlockAddClick = (type: PageBlockType) => {
    this.addBlock(this.getBlockComponent(type).create());
  };
  
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
  
  private readonly eventPageBlockFocus = (focus: PageBlockEntity<PageBlockType>) => {
    this.setState({focus});
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

export interface DefaultBlockProps<Type extends PageBlockType = PageBlockType> extends React.PropsWithChildren<any> {
  ref: React.Ref<any>;
  block: PageBlockEntity<Type>;
  readonly?: boolean;
  className?: string;
  
  onBlur?(block: PageBlockEntity<Type>): void;
  onFocus?(block: PageBlockEntity<Type>): void;
  onChange(block: PageBlockEntity<Type>): void;
  onSubmit?(block: PageBlockEntity<Type>): void;
}

export type PageBlockInterface = {
  decorate(decoration: Initializer<Decoration>): void;
}

export interface PageExplorerProps {
  readonly?: boolean;
  className?: string;
  
  entity: PageEntity;
  onChange(entity: PageEntity): void;
}

interface State {
  ref: React.RefObject<PageBlockInterface>;
  edit: boolean;
  focus?: PageBlockEntity;
  
  text_color: boolean
}
