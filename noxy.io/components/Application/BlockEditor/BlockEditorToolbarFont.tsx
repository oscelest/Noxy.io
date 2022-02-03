import React from "react";
import {RichTextDecorationFont} from "../../../classes/RichText/RichTextDecoration";
import AutoComplete from "../../Form/AutoComplete";
import Component from "../Component";
import Style from "./BlockEditorToolbarFont.module.scss";
import Helper from "../../../Helper";

export default class BlockEditorToolbarFont extends Component<BlockEditorToolbarFontProps, State> {

  private static font_size_list: string[] = ["", ...Helper.FontSizeList];
  private static font_family_list: string[] = ["", ...Helper.FontFamilyList];

  constructor(props: BlockEditorToolbarFontProps) {
    super(props);
    this.state = {
      dropdown_color:            false,
      dropdown_background_color: false,
    };
  }

  public render() {
    const {className, disabled} = this.props;
    const {font_size = "", font_family = ""} = this.props.value;

    const classes = [Style.Component];
    if (className) classes.push(className);

    const font_size_index = BlockEditorToolbarFont.font_size_list.findIndex(value => value === font_size);
    const font_family_index = BlockEditorToolbarFont.font_family_list.findIndex(value => value === font_family);

    return (
      <div className={classes.join(" ")}>
        <AutoComplete className={Style.FontFamily} label={"Font"} value={font_family} index={font_family_index} strict={true} disabled={disabled}
                      onChange={this.eventFontFamilyChange} onInputChange={this.eventFontFamilyPreview} onIndexChange={this.eventFontFamilyPreview} onReset={this.eventReset}>
          {BlockEditorToolbarFont.font_family_list}
        </AutoComplete>

        <AutoComplete className={Style.FontSize} label={"Size"} value={font_size} index={font_size_index} disabled={disabled}
                      onChange={this.eventFontSizeChange} onInputChange={this.eventFontSizePreview} onIndexChange={this.eventFontSizePreview} onReset={this.eventReset}>
          {BlockEditorToolbarFont.font_size_list}
        </AutoComplete>
      </div>
    );
  }

  private readonly eventFontFamilyPreview = (value: string | number) => {
    this.props.onPreview({font_family: typeof value === "string" ? value : BlockEditorToolbarFont.font_family_list[value]});
  };

  private readonly eventFontFamilyChange = (font_family: string) => {
    this.props.onChange({font_family});
  };

  private readonly eventFontSizePreview = (value: string | number) => {
    this.props.onPreview({font_size: typeof value === "string" ? value : BlockEditorToolbarFont.font_size_list[value]});
  };

  private readonly eventFontSizeChange = (font_size: string) => {
    this.props.onChange({font_size});
  };

  private readonly eventReset = () => {
    this.props.onPreview();
  };
}

export interface BlockEditorToolbarFontProps {
  className?: string;
  disabled?: boolean;

  value: RichTextDecorationFont;

  onChange(decoration: RichTextDecorationFont): void;
  onPreview(decoration?: RichTextDecorationFont): void;
}

interface State {
  dialog?: string;

  dropdown_color: boolean;
  dropdown_background_color: boolean;
}
