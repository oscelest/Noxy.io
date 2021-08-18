import Component from "./Component";
import Style from "./PageExplorer.module.scss";
import PageEntity from "../../entities/Page/PageEntity";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import TextBlock from "../Block/TextBlock";
import Conditional from "./Conditional";
import Button from "../Form/Button";
import IconType from "../../enums/IconType";
import HTMLText from "../../classes/HTMLText";
import {v4} from "uuid";

export default class PageExplorer extends Component<PageExplorerProps, State> {

  constructor(props: PageExplorerProps) {
    super(props);
    this.state = {
      edit: true,
    };
  }

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
            <Button icon={IconType.UI_ADD} onClick={this.eventPageBlockAdd}/>
          </div>
        </Conditional>
      </div>
    );
  }

  private readonly renderPageBlock = (block: PageBlockEntity<any>, key: number = 0) => {
    return (
      <TextBlock key={key} block={block} readonly={!this.state.edit} onChange={this.eventPageBlockChange}/>
    );
  };

  private readonly eventEditModeClick = () => {
    this.setState({edit: !this.state.edit});
  };

  private readonly eventPageBlockAdd = () => {
    this.props.onChange(new PageEntity({...this.props.entity, page_block_list: [...this.props.entity.page_block_list, new PageBlockEntity({id: v4(), content: new HTMLText("Test")})]}));
  };

  private readonly eventPageBlockChange = (block: PageBlockEntity) => {

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
