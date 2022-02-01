import React from "react";
import {v4} from "uuid";
import PageBlockType from "../../../../common/enums/PageBlockType";
import RichTextDecoration from "../../../classes/RichText/RichTextDecoration";
import PageBlockEntity from "../../../entities/Page/PageBlockEntity";
import PageEntity from "../../../entities/Page/PageEntity";
import IconType from "../../../enums/IconType";
import HeaderBlock from "../../Block/HeaderBlock";
import ListBlock from "../../Block/ListBlock";
import TableBlock from "../../Block/TableBlock";
import TextBlock from "../../Block/TextBlock";
import Button from "../../Form/Button";
import EditText from "../../Text/EditText";
import Component from "../Component";
import Conditional from "../Conditional";
import Style from "./BlockEditor.module.scss";
import ImageBlock from "../../Block/ImageBlock";
import Util from "../../../../common/services/Util";
import DragSortList from "../../Base/DragSortList";
import BlockEditorToolbar from "./BlockEditorToolbar";
import Alignment from "../../../../common/enums/Alignment";
import Helper from "../../../Helper";
import KeyboardCommand from "../../../enums/KeyboardCommand";

export default class BlockEditor extends Component<PageExplorerProps, State> {

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
      edit:                      true,
      dropdown_color:            false,
      dropdown_background_color: false,
      alignment:                 Alignment.LEFT,
      decoration:                new RichTextDecoration({
        font_size:   "",
        font_family: "",
      }),
    };
  }

  public componentDidMount(): void {
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list: this.props.entity.page_block_list.sort((a, b) => a.weight - b.weight)}));
  }

  public render() {
    const {readonly = true, className, entity} = this.props;
    const {edit} = this.state;

    const classes = [Style.Component];
    if (className) classes.push(className);
    if (edit) classes.push(Style.Edit);
    if (readonly) classes.push(Style.Readonly);

    return (
      <div tabIndex={0} className={classes.join(" ")} onKeyDown={this.eventKeyDown}>
        <div className={Style.Toolbar}>
          <Conditional condition={!readonly}>
            <BlockEditorToolbar alignment={this.state.alignment} decoration={this.state.decoration} text={this.state.text}/>
            <Button className={Style.ButtonEdit} icon={edit ? IconType.FILE_DOCUMENT : IconType.EDIT} onClick={this.eventEditModeClick}/>
          </Conditional>
        </div>

        <Conditional condition={edit}>
          <DragSortList list={this.props.entity.page_block_list} onRender={this.renderPageBlock} onKey={this.eventPageBlockListKey} onChange={this.eventPageBlockListChange}/>
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
    return React.createElement(BlockEditor.block_map[block.type], {
      block,
      className:          Style.PageBlock,
      readonly:           !this.state.edit,
      decoration:         this.state.decoration,
      onPageBlockChange:  this.eventPageBlockChange,
      onAlignmentChange:  this.eventAlignmentChange,
      onDecorationChange: this.eventDecorationChange,
      onEditTextChange:   this.eventEditTextChange,
    });
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    this.handleKeyDown(event);
    if (!event.bubbles) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  };

  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const command = Helper.getKeyboardEventCommand(event);
    event.bubbles = false;

    switch (command) {
      case KeyboardCommand.REDO:
      case KeyboardCommand.REDO_ALT:
        return console.log("Redo");
      case KeyboardCommand.UNDO:
      case KeyboardCommand.UNDO_ALT:
        return console.log("Undo");
    }

    event.bubbles = true;
  };

  private readonly eventPageBlockRemove = (index: number) => {
    const page_block_list = [...this.props.entity.page_block_list];
    page_block_list.splice(index, 1);
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));
  };

  private readonly eventPageBlockChange = (block: PageBlockEntity) => {
    const index = this.props.entity.page_block_list.findIndex(value => value.getPrimaryID() === block.getPrimaryID());
    const offset = index < 0 ? this.props.entity.page_block_list.length : index;

    this.props.onChange(new PageEntity({...this.props.entity, page_block_list: Util.arrayReplace(this.props.entity.page_block_list, offset, block)}));
  };

  private readonly eventAlignmentChange = (alignment: Alignment) => {
    this.setState({alignment});
  };

  private readonly eventDecorationChange = (decoration: RichTextDecoration) => {
    this.setState({decoration});
  };

  private readonly eventEditTextChange = (text?: EditText) => {
    this.setState({text});
  };

  private readonly eventPageBlockListKey = (page_block: PageBlockEntity) => {
    return page_block.getPrimaryID();
  };

  private readonly eventPageBlockListChange = (page_block_list: PageBlockEntity[]) => {
    page_block_list.forEach((block, index) => block.weight = index);
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));
  };

  private readonly eventPageBlockAddClick = (type: PageBlockType) => {
    const page_block_list = [...this.props.entity.page_block_list, new PageBlockEntity({id: v4(), type, weight: this.props.entity.page_block_list.length})];
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));
  };

  private readonly eventEditModeClick = () => {
    this.setState({edit: !this.state.edit});
  };
}

export interface PageExplorerBlockProps<Content = any> {
  readonly: boolean;
  className?: string;

  block: PageBlockEntity<Content>;
  decoration: RichTextDecoration;

  onEditTextChange(text: EditText): void;
  onPageBlockChange(block: PageBlockEntity<Content>): void;
  onAlignmentChange(alignment: Alignment): void;
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

  dropdown_color: boolean;
  dropdown_background_color: boolean;

  text?: EditText;
  alignment: Alignment;
  decoration: RichTextDecoration;
}
