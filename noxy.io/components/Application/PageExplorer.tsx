import Component from "./Component";
import Style from "./PageExplorer.module.scss";
import PageEntity from "../../entities/Page/PageEntity";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import TextBlock from "../Block/TextBlock";
import Conditional from "./Conditional";
import Button from "../Form/Button";
import IconType from "../../enums/IconType";
import {v4} from "uuid";
import PageBlockType from "../../../common/enums/PageBlockType";
import TableBlock from "../Block/TableBlock";
import {Character} from "../../classes/Character";

export default class PageExplorer extends Component<PageExplorerProps, State> {

  constructor(props: PageExplorerProps) {
    super(props);
    this.state = {
      edit: true,
    };
  }

  private readonly addBlock = (block: PageBlockEntity) => {
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list: [...this.props.entity.page_block_list, block]}));
  };

  public render() {
    const readonly = this.props.readonly ?? true;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <div className={Style.Toolbar}>
          <Conditional condition={readonly}>
            <Button className={Style.ButtonEdit} icon={this.state.edit ? IconType.FILE_DOCUMENT : IconType.EDIT} onClick={this.eventEditModeClick}/>
          </Conditional>
        </div>

        <div className={Style.BlockList}>
          {this.props.entity.page_block_list.map(this.renderPageBlock)}
        </div>

        <Conditional condition={this.state.edit}>
          <div className={Style.Append}>
            <Button icon={IconType.FONT} onClick={this.eventTextBlockAdd}/>
            <Button icon={IconType.TABLE} onClick={this.eventTableBlockAdd}/>
          </div>
        </Conditional>
      </div>
    );
  }

  private readonly renderPageBlock = (block: PageBlockEntity<PageBlockType>, key: number = 0) => {
    switch (block.type) {
      case PageBlockType.TEXT:
        return <TextBlock key={key} block={block as PageBlockEntity<PageBlockType.TEXT>} readonly={!this.state.edit} onChange={this.eventPageBlockChange}/>;
      case PageBlockType.HEADER:
        return null;
      case PageBlockType.TABLE:
        return <TableBlock key={key} block={block as PageBlockEntity<PageBlockType.TABLE>} readonly={!this.state.edit} onChange={this.eventPageBlockChange}/>;
      case PageBlockType.UNKNOWN:
        return null;
    }
  };

  private readonly eventEditModeClick = () => {
    this.setState({edit: !this.state.edit});
  };

  private readonly eventTextBlockAdd = () => {
    this.addBlock(new PageBlockEntity({id: v4(), type: PageBlockType.TEXT, content: [new Character("Test")]}));
  };

  private readonly eventTableBlockAdd = () => {
    this.addBlock(new PageBlockEntity({
      id:      v4(),
      type:    PageBlockType.TABLE,
      content: [
        [
          [new Character("T")],
          [new Character("E")],
        ],
        [
          [new Character("S")],
          [new Character("T")],
        ],
      ],
    }));
  };

  private readonly eventPageBlockChange = (block: PageBlockEntity<PageBlockType>) => {
    const index = this.props.entity.page_block_list.findIndex((value) => value.getPrimaryID() === block.getPrimaryID());
    const offset = index < 0 ? this.props.entity.page_block_list.length : index;
    const page_block_list = [...this.props.entity.page_block_list.slice(0, offset), block, ...this.props.entity.page_block_list.slice(offset + 1)];
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list}));
  };
}

export interface PageExplorerProps {
  readonly?: boolean;
  className?: string;

  entity: PageEntity;
  onChange(entity: PageEntity): void;
}

interface State {
  edit: boolean;
}
