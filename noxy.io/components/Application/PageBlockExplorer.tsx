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

export default class PageBlockExplorer extends Component<PageBlockExplorerProps, State> {

  constructor(props: PageBlockExplorerProps) {
    super(props);
    this.state = {};
  }

  public readonly createBlock = async <V extends {}>(type: PageBlockType, content: V) => {
    const entity = await PageBlockEntity.postOne({type, content, weight: this.props.page.block_list.length, page: this.props.page});
    this.props.onChange(entity);
  };

  public render() {
    const {} = this.state;

    return (
      <div className={Style.Component}>
        {this.props.page.block_list.map(this.renderBlock)}
        <div className={Style.ActionList}>
          <Button icon={IconType.HEADING} onClick={this.eventHeadingPageBlockCreate}/>
          <Button icon={IconType.PARAGRAPH} onClick={this.eventTextPageBlockCreate}/>
        </div>
      </div>
    );
  }

  private readonly renderBlock = (block: PageBlockEntity<any>, index: number = 0) => {
    switch (block.type) {
      case PageBlockType.HEADER:
        return <HeaderPageBlock key={index} block={block}/>;
      case PageBlockType.TEXT:
        return <TextPageBlock key={index} block={block}/>;
    }
    return null;
  };

  private readonly eventHeadingPageBlockCreate = () => this.createBlock<HeaderBlockContent>(PageBlockType.HEADER, {value: "Header", level: 1});
  private readonly eventTextPageBlockCreate = () => this.createBlock(PageBlockType.TEXT, {});

}

export interface PageBlockExplorerProps {
  page: PageEntity
  readonly: boolean
  onChange: (block: PageBlockEntity) => void
}

interface State {

}
