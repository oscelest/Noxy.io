import React from "react";
import Component from "../Application/Component";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import Style from "./ImageBlock.module.scss";
import Dialog from "../Application/Dialog";
import FileExplorer from "../Application/FileExplorer";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import EditText, {EditTextSelection} from "../Text/EditText";
import RichText, {RichTextInitializer} from "../../classes/RichText/RichText";
import Conditional from "../Application/Conditional";
import Button from "../Form/Button";
import Input from "../Form/Input";
import Alignment from "../../../common/enums/Alignment";
import IconType from "../../enums/IconType";
import {RichTextDecorationKeys} from "../../classes/RichText/RichTextDecoration";
import Switch, {SwitchItem} from "../Form/Switch";

export default class ImageBlock extends Component<ImageBlockProps, State> {

  private static readonly blacklist: RichTextDecorationKeys[] = [];
  private static readonly whitelist: RichTextDecorationKeys[] = [];

  private static switch_alignment: SwitchItem<Alignment>[] = [
    {value: Alignment.LEFT, icon: IconType.ALIGN_LEFT},
    {value: Alignment.CENTER, icon: IconType.ALIGN_CENTER},
    {value: Alignment.RIGHT, icon: IconType.ALIGN_RIGHT},
  ];

  constructor(props: ImageBlockProps) {
    super(props);
    this.state = {
      selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: true},
    };
  }

  private getContent() {
    if (!this.props.block.content) throw new Error("Could not get block content.");
    return this.props.block.content;
  }

  private getContentClass() {
    const classes = [Style.Content];
    if (this.props.block.content?.alignment === Alignment.LEFT) classes.push(Style.Left);
    if (this.props.block.content?.alignment === Alignment.CENTER) classes.push(Style.Center);
    if (this.props.block.content?.alignment === Alignment.RIGHT) classes.push(Style.Right);
    return classes.join(" ");
  }

  private static parseInitializerCaption(entity?: PageBlockEntity<ImageBlockInitializer>) {
    return new RichText({
      element:      "div",
      section_list: entity?.content?.caption.section_list,
    });
  }

  public componentDidMount() {
    this.props.onPageBlockChange(new PageBlockEntity<ImageBlockContent>({
      ...this.props.block,
      content: {
        url:       this.props.block.content?.url ?? "",
        caption:   ImageBlock.parseInitializerCaption(this.props.block),
        alignment: this.props.block.content?.alignment ?? Alignment.LEFT,
      },
    }));
  }

  public render() {
    const {readonly = true, decoration, block, className, onDecorationChange} = this.props;
    const {selection} = this.state;
    if (!block.content || !block.content.caption && readonly) return null;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div className={classes.join(" ")}>
        <Conditional condition={!readonly}>
          <div className={Style.OptionList}>
            <Button onClick={this.eventOpenDialog}>Browse</Button>
            <Input label={"Link to image"} value={block.content.url} onChange={this.eventURLChange}/>
            <Switch value={block.content.alignment} onChange={this.eventAlignmentChange} list={ImageBlock.switch_alignment}/>
          </div>
        </Conditional>
        <div className={this.getContentClass()}>
          <img className={Style.Preview} src={block.content.url} alt={""}/>
          <div className={Style.Caption}>
          <EditText readonly={readonly} selection={selection} decoration={decoration} whitelist={ImageBlock.whitelist} blacklist={ImageBlock.blacklist}
                    onFocus={this.eventFocus} onSelect={this.eventSelect} onDecorationChange={onDecorationChange} onTextChange={this.eventCaptionChange}>
            {block.content.caption}
          </EditText>
          </div>
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
    this.props.onDecorationChange(component.text.getDecoration(selection));
  };

  private readonly eventURLChange = (url: string) => {
    this.props.onPageBlockChange(new PageBlockEntity<ImageBlockContent>({...this.props.block, content: {...this.getContent(), url}}));
  };

  private readonly eventAlignmentChange = (alignment: Alignment) => {
    this.props.onPageBlockChange(new PageBlockEntity<ImageBlockContent>({...this.props.block, content: {...this.getContent(), alignment}}));
  };

  private readonly eventCaptionChange = (caption: RichText, selection: EditTextSelection) => {
    this.props.onPageBlockChange(new PageBlockEntity<ImageBlockContent>({...this.props.block, content: {...this.getContent(), caption}}));
    this.setState({selection});
  };
}

export interface ImageBlockContent extends ImageBlockBase {
  caption: RichText;
}

export interface ImageBlockInitializer extends ImageBlockBase {
  caption: RichText | RichTextInitializer;
}

interface ImageBlockBase {
  url: string;
  alignment: Alignment;
}

export interface ImageBlockProps extends PageExplorerBlockProps<ImageBlockContent> {

}

interface State {
  dialog?: string;
  selection: EditTextSelection;
}
