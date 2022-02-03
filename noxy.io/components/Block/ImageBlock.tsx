import React from "react";
import Alignment from "../../../common/enums/Alignment";
import Button from "../Form/Button";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import Dialog from "../Application/Dialog";
import EditText, {EditTextSelection} from "../Text/EditText";
import FileExplorer from "../Application/FileExplorer";
import Input from "../Form/Input";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import RichText, {RichTextInitializer} from "../../classes/RichText/RichText";
import {PageExplorerBlockProps} from "../Application/BlockEditor/BlockEditor";
import {RichTextDecorationKeys} from "../../classes/RichText/RichTextDecoration";
import Style from "./ImageBlock.module.scss";
import RichTextSection from "../../classes/RichText/RichTextSection";

export default class ImageBlock extends Component<ImageBlockProps, State> {

  private static readonly blacklist: RichTextDecorationKeys[] = [];
  private static readonly whitelist: RichTextDecorationKeys[] = [];

  constructor(props: ImageBlockProps) {
    super(props);
    this.state = {
      selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: true},
    };
  }

  private getContentClass() {
    const classes = [Style.Content];
    if (this.props.block.content?.caption.alignment === Alignment.LEFT) classes.push(Style.Left);
    if (this.props.block.content?.caption.alignment === Alignment.CENTER) classes.push(Style.Center);
    if (this.props.block.content?.caption.alignment === Alignment.RIGHT) classes.push(Style.Right);
    return classes.join(" ");
  }

  private static getContent(content?: ImageBlockInitializer): ImageBlockContent {
    return {
      url:     content?.url ?? "",
      caption: new RichText({
        ...content?.caption,
        element:      "div",
        section_list: this.getSectionList(content?.caption?.section_list),
      }),
    };
  }

  private static getSectionList(list?: RichTextInitializer["section_list"]) {
    if (typeof list === "string") return list;
    if (Array.isArray(list)) {
      const section_list = [];
      for (let i = 0; i < list.length; i++) {
        const item = list.at(i);
        if (!item) continue;
        if (item instanceof RichTextSection) {
          section_list.push(new RichTextSection({...item, element: "p"}));
        }
        else if (typeof item === "string") {
          section_list.push(new RichTextSection({character_list: item}));
        }
        else {
          section_list.push(new RichTextSection({character_list: item?.character_list}));
        }
      }
      return section_list;
    }
    return [new RichTextSection()];
  }

  public render() {
    const {readonly = true, decoration, block, className, onAlignmentChange, onDecorationChange} = this.props;
    const {selection} = this.state;

    const content = ImageBlock.getContent(block.content);
    if (!content.url && readonly) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <Conditional condition={!readonly}>
          <div className={Style.OptionList}>
            <Button onClick={this.eventOpenDialog}>Browse</Button>
            <Input label={"Link to image"} value={content.url} onChange={this.eventURLChange}/>
          </div>
        </Conditional>
        <div className={this.getContentClass()}>
          <img className={Style.Preview} src={content.url} alt={""}/>
          <Conditional condition={!readonly || content.caption.size}>
            <div className={Style.Caption}>
              <EditText readonly={readonly} selection={selection} decoration={decoration} whitelist={ImageBlock.whitelist} blacklist={ImageBlock.blacklist}
                        onFocus={this.eventFocus} onSelect={this.eventSelect} onAlignmentChange={onAlignmentChange} onDecorationChange={onDecorationChange} onTextChange={this.eventCaptionChange}>
                {content.caption}
              </EditText>
            </div>
          </Conditional>
        </div>
      </div>
    );
  }

  private readonly eventOpenDialog = () => {
    this.setState({dialog: Dialog.show(<FileExplorer/>)});
  };

  private readonly eventFocus = (event: React.FocusEvent<HTMLDivElement>, component: EditText) => {
    this.props.onEditTextChange(component);
  };

  private readonly eventSelect = (selection: EditTextSelection, component: EditText) => {
    this.setState({selection});
    this.props.onDecorationChange(component.value.getDecoration(selection));
  };

  private readonly eventURLChange = (url: string) => {
    this.props.onPageBlockChange(new PageBlockEntity({...this.props.block, content: ImageBlock.getContent({...this.props.block.content, url})}));
  };

  private readonly eventCaptionChange = (caption: RichText, selection: EditTextSelection) => {
    this.props.onPageBlockChange(new PageBlockEntity({...this.props.block, content: ImageBlock.getContent({...this.props.block.content, caption})}));
    this.setState({selection});
  };
}

export interface ImageBlockContent {
  url: string;
  caption: RichText;
}

export interface ImageBlockInitializer {
  url?: string;
  caption?: RichText | RichTextInitializer;
}

export interface ImageBlockProps extends PageExplorerBlockProps<ImageBlockContent> {

}

interface State {
  dialog?: string;
  selection: EditTextSelection;
}
