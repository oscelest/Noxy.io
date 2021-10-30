import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText, {RichTextObject} from "../../../classes/RichText/RichText";
import RichTextSection from "../../../classes/RichText/RichTextSection";
import PageBlockEntity, {PageBlockInitializer} from "../PageBlockEntity";

export default class TextPageBlockEntity extends PageBlockEntity<PageBlockType.TEXT> {
  
  public content: TextBlockContent;
  
  constructor(initializer?: TextBlockInitializer) {
    super(initializer);
    this.type = PageBlockType.TEXT;
    this.content = {
      value: new RichText({
        section_list: initializer?.content?.value?.section_list.map(
          section => new RichTextSection({
            character_list: section.character_list,
            element:        "p",
          })) ?? [],
        element:      "div",
      }),
    };
  }
  
  public replaceText(old_text: TextBlockText, new_text: TextBlockText) {
    if (this.content.value.id !== old_text.id) throw new Error("Could not find text in TextBlock.");
    this.content.value = new_text;
    return this;
  }
}

export type TextBlockText = RichText

export interface TextBlockContent {
  value: RichText;
}

export interface TextBlockInitializer extends PageBlockInitializer {
  content?: {
    value?: RichText | RichTextObject
  };
}
