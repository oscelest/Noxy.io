import React from "react";
import Style from "./PageBlockExplorer.module.scss";
import Component from "./Component";
import PageBlockEntity from "../../entities/page/PageBlockEntity";
import PageBlockType from "../../../common/enums/PageBlockType";
import TextPageBlock from "../PageBlock/TextPageBlock";
import Button from "../Form/Button";
import IconType from "../../enums/IconType";
import PageEntity from "../../entities/page/PageEntity";
import HeaderPageBlock, {HeaderBlockContent} from "../PageBlock/HeaderPageBlock";
import Conditional from "./Conditional";

export default class PageBlockExplorer extends Component<PageBlockExplorerProps, State> {

  constructor(props: PageBlockExplorerProps) {
    super(props);
    this.state = {};
  }

  public readonly createBlock = async <V extends {}>(type: PageBlockType, content: V) => {
    const entity = await PageBlockEntity.postOne({type, content, weight: this.props.page.block_list.length, page: this.props.page});
    this.props.onCreate?.(entity);
  };

  public readonly isReadOnly = () => {
    return (this.props.onChange && this.props.readonly) ?? true;
  };

  public render() {
    return (
      <div className={Style.Component}>
        {this.props.page.block_list.map(this.renderBlock)}
        <Conditional condition={!this.isReadOnly()}>
          <div className={Style.ActionList}>
            <Button icon={IconType.HEADING} onClick={this.eventHeadingPageBlockCreate}/>
            <Button icon={IconType.PARAGRAPH} onClick={this.eventTextPageBlockCreate}/>
          </div>
        </Conditional>
      </div>
    );
  }

  private readonly renderBlock = (block: PageBlockEntity<any>, index: number = 0) => {
    const readonly = this.isReadOnly();

    switch (block.type) {
      case PageBlockType.HEADER:
        return (<HeaderPageBlock key={index} block={block} readonly={readonly} onChange={this.eventChange}/>);
      case PageBlockType.TEXT:
        return (<TextPageBlock key={index} block={block} readonly={readonly} onChange={this.eventChange}/>);
    }
    return null;
  };

  private readonly eventHeadingPageBlockCreate = () => this.createBlock<HeaderBlockContent>(PageBlockType.HEADER, {value: "Header", level: 1});
  private readonly eventTextPageBlockCreate = () => this.createBlock(PageBlockType.TEXT, {});

  private readonly eventChange = async (block: PageBlockEntity) => this.props.onChange?.(await PageBlockEntity.putOne(block));

}

export interface PageBlockProps<Content extends {} = {}> {
  block: PageBlockEntity<Content>
  readonly?: boolean
  onChange(block: PageBlockEntity<Content>): void
}

export interface PageBlockExplorerProps {
  page: PageEntity
  readonly?: boolean
  onCreate?: (block: PageBlockEntity) => void
  onChange?: (block: PageBlockEntity) => void
}

interface State {

}
