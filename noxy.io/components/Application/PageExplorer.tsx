import React from "react";
import PageBlockType from "../../../common/enums/PageBlockType";
import Decoration from "../../classes/Decoration";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import PageEntity from "../../entities/Page/PageEntity";
import IconType from "../../enums/IconType";
import HeaderBlock from "../Block/HeaderBlock";
import TableBlock from "../Block/TableBlock";
import TextBlock from "../Block/TextBlock";
import Button from "../Form/Button";
import Input from "../Form/Input";
import EditText, {Selection} from "../Text/EditText";
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
      edit:       true,
      text_color: false,
      decoration: new Decoration()
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
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    if (this.props.readonly ?? true) classes.push(Style.Readonly);
    
    return (
      <div className={classes.join(" ")}>
        <div className={Style.Toolbar}>
          <Conditional condition={!this.isReadonly()}>
            <div className={Style.Left}>
              <Button value={PageExplorer.BoldDecoration} icon={IconType.BOLD} disabled={this.state.focus?.isDecorationDisabled("bold")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button value={PageExplorer.ItalicDecoration} icon={IconType.ITALIC} disabled={this.state.focus?.isDecorationDisabled("italic")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button value={PageExplorer.StrikethroughDecoration} icon={IconType.STRIKE_THROUGH} disabled={this.state.focus?.isDecorationDisabled("strikethrough")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button value={PageExplorer.UnderlineDecoration} icon={IconType.UNDERLINE} disabled={this.state.focus?.isDecorationDisabled("underline")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button value={PageExplorer.CodeDecoration} icon={IconType.CODE_ALT} disabled={this.state.focus?.isDecorationDisabled("code")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
              
              <Button value={PageExplorer.MarkDecoration} icon={IconType.MARKER} disabled={this.state.focus?.isDecorationDisabled("mark")}
                      onClick={this.eventDecorateClick} onMouseDown={this.eventDecorateMouseDown}/>
            </div>
            
            <div>
              <Input className={Style.FontFamily} label={"Font"} value={"Helvetica"} onChange={() => {}}>
                {["Helvetica", "Nunito"]}
              </Input>
              
              <Input className={Style.FontSize} label={"Font"} value={"14px"} onChange={() => {}}>
                {["8px", "10px", "12px", "14px", "18px", "24px"]}
              </Input>
              
              <Button icon={IconType.FONT}/>
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
  
  private readonly eventPageBlockFocus = (event: React.FocusEvent<HTMLDivElement>, focus: EditText) => {
    this.setState({focus});
  };
  
  private readonly eventPageBlockSelect = ({start, end}: Selection, component: EditText) => {
    if (start === end) start = Math.max(0, start - 1);
    this.setState({decoration: component.getText().slice(start, end).getTextDecoration()})
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
  decoration: Decoration;
  
  text_color: boolean;
}
