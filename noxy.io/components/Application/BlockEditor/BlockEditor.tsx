import React from "react";
import {v4} from "uuid";
import PageBlockType from "../../../../common/enums/PageBlockType";
import RichTextDecoration from "../../../classes/RichText/RichTextDecoration";
import PageBlockEntity from "../../../entities/Page/PageBlockEntity";
import PageEntity from "../../../entities/Page/PageEntity";
import IconType from "../../../enums/IconType";
import Button from "../../Form/Button";
import EditText from "../../Text/EditText";
import Component from "../Component";
import Conditional from "../Conditional";
import Style from "./BlockEditor.module.scss";
import Util from "../../../../common/services/Util";
import DragSortList from "../../Base/DragSortList";
import BlockEditorToolbar from "./BlockEditorToolbar";
import Alignment from "../../../../common/enums/Alignment";
import Helper, {KeyboardCommandDelegate} from "../../../Helper";
import KeyboardCommand from "../../../enums/KeyboardCommand";
import History from "../../../../common/classes/History";
import FatalException from "../../../exceptions/FatalException";
import TextBlock from "../../Block/TextBlock";
import TableBlock from "../../Block/TableBlock";
import HeaderBlock from "components/Block/HeaderBlock";
import ImageBlock from "../../Block/ImageBlock";
import ListBlock from "../../Block/ListBlock";

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
      ref:        React.createRef(),
      edit:       true,
      history:    new History(),
      alignment:  Alignment.LEFT,
      decoration: new RichTextDecoration(),
    };
  }

  private loadHistory(pointer: number) {
    const history = this.state.history.loadPoint(pointer);
    this.props.onChange(history.value);
    this.setState({history});
  }

  private updatePageWithBlock(block: PageBlockEntity) {
    const index = this.props.entity.page_block_list.findIndex(value => value.getPrimaryID() === block.getPrimaryID());
    if (index === -1) {
      return new PageEntity({...this.props.entity, page_block_list: [...this.props.entity.page_block_list, block]});
    }
    return new PageEntity({...this.props.entity, page_block_list: Util.arrayReplace(this.props.entity.page_block_list, index, block)});
  }

  public componentDidMount(): void {
    const page = new PageEntity({...this.props.entity, page_block_list: this.props.entity.page_block_list.sort((a, b) => a.weight - b.weight)});
    this.setState({history: this.state.history.push(page)});
    this.props.onChange(page);
  }

  public render() {
    const {readonly = true, className, entity} = this.props;
    const {ref, edit, alignment, decoration, text} = this.state;

    const classes = [Style.Component];
    if (edit) classes.push(Style.Edit);
    if (readonly) classes.push(Style.Readonly);
    if (className) classes.push(className);

    return (
      <div ref={ref} tabIndex={0} className={classes.join(" ")} onKeyDown={this.eventKeyDown}>
        <div className={Style.Toolbar}>
          <Conditional condition={!readonly}>
            <BlockEditorToolbar alignment={alignment} decoration={decoration} text={text}/>
            <Button className={Style.ButtonEdit} icon={edit ? IconType.FILE_DOCUMENT : IconType.EDIT} onClick={this.eventEditModeClick}/>
          </Conditional>
        </div>

        <Conditional condition={edit}>
          <DragSortList className={Style.BlockList} list={entity.page_block_list} onRender={this.renderBlock} onKey={this.eventPageBlockListKey} onChange={this.eventPageBlockListChange}/>
        </Conditional>
        <Conditional condition={!edit}>
          <div className={Style.BlockList}>
            {entity.page_block_list.map(this.renderPageBlock)}
          </div>
        </Conditional>

        <Conditional condition={edit}>
          <div className={Style.BlockBar}>
            <Button value={PageBlockType.TEXT} icon={IconType.PLUS} onClick={this.eventPageBlockAdd}>Text</Button>
            <Button value={PageBlockType.TABLE} icon={IconType.PLUS} onClick={this.eventPageBlockAdd}>Table</Button>
            <Button value={PageBlockType.HEADER} icon={IconType.PLUS} onClick={this.eventPageBlockAdd}>Header</Button>
            <Button value={PageBlockType.LIST} icon={IconType.PLUS} onClick={this.eventPageBlockAdd}>List</Button>
            <Button value={PageBlockType.IMAGE} icon={IconType.PLUS} onClick={this.eventPageBlockAdd}>Image</Button>
          </div>
        </Conditional>
      </div>
    );
  }

  private readonly renderBlock = (block: PageBlockEntity, index: number = 0) => {
    return (
      <div key={block.id} className={Style.Block}>
        {this.renderPageBlock(block)}
        <div className={Style.BlockActionList}>
          <Button value={index} icon={IconType.CLOSE} onClick={this.eventPageBlockRemove}/>
        </div>
      </div>
    );
  };

  private readonly renderPageBlock = (block: PageBlockEntity) => {
    return React.createElement(BlockEditor.block_map[block.type], {
      block,
      key:                block.id,
      className:          Style.PageBlock,
      readonly:           !this.state.edit,
      decoration:         this.state.decoration,
      onEditTextChange:   this.eventEditTextChange,
      onAlignmentChange:  this.eventAlignmentChange,
      onPageBlockChange:  this.eventPageBlockChange,
      onDecorationChange: this.eventDecorationChange,
    });
  };

  private readonly eventPageBlockListKey = (page_block: PageBlockEntity) => {
    return page_block.getPrimaryID();
  };

  private readonly eventEditModeClick = () => {
    this.setState({edit: !this.state.edit});
  };

  private readonly eventPageBlockAdd = (type: PageBlockType) => {
    const page_block_list = [...this.props.entity.page_block_list, new PageBlockEntity({id: v4(), page: this.props.entity, type, weight: this.props.entity.page_block_list.length})];
    const page = new PageEntity({...this.props.entity, page_block_list});
    this.props.onChange(page);
    this.setState({history: this.state.history.push(page)});
  };

  private readonly eventPageBlockRemove = (index: number) => {
    const page_block_list = Util.arrayRemoveIndex(this.props.entity.page_block_list, index);
    const page = new PageEntity({...this.props.entity, page_block_list});
    this.setState({history: this.state.history.push(page)});
    this.props.onChange(page);
  };

  private readonly eventPageBlockChange = (block: PageBlockEntity) => {
    if (block.page.getPrimaryID() !== this.props.entity.getPrimaryID()) {
      throw new FatalException("Page block changed, but it does not belong to this page.");
    }
    const page = this.updatePageWithBlock(block);
    this.setState({history: this.state.history.push(page)});
    this.props.onChange(page);
  };

  private readonly eventPageBlockListChange = (page_block_list: PageBlockEntity[]) => {
    page_block_list.forEach((block, index) => block.weight = index);
    const page = new PageEntity({...this.props.entity, page_block_list});
    this.setState({history: this.state.history.push(page)});
    this.props.onChange(page);
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

  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const delegate = Helper.getKeyboardCommandDelegate(event);
    this.handleKeyDown(delegate);

    if (delegate.handled) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  };

  private readonly handleKeyDown = (delegate: KeyboardCommandDelegate) => {
    delegate.handled = true;

    switch (delegate.command) {
      case KeyboardCommand.REDO:
      case KeyboardCommand.REDO_ALT:
        this.state.ref.current?.focus();
        return this.loadHistory(this.state.history.pointer + 1);
      case KeyboardCommand.UNDO:
      case KeyboardCommand.UNDO_ALT:
        this.state.ref.current?.focus();
        return this.loadHistory(this.state.history.pointer - 1);
    }

    delegate.handled = false;
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
  ref: React.RefObject<HTMLDivElement>;
  edit: boolean;
  text?: EditText;
  history: History<PageEntity>;
  alignment: Alignment;
  decoration: RichTextDecoration;
}
