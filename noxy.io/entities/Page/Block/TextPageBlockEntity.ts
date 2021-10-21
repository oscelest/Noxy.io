import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText, {RichTextContent} from "../../../classes/RichText/RichText";
import PageBlockEntity, {PageBlockInitializer} from "../PageBlockEntity";

export default class TextPageBlockEntity extends PageBlockEntity<PageBlockType.TEXT> {
  
  public content: TextBlockContent;
  
  constructor(initializer?: TextBlockInitializer) {
    super(initializer);
    this.type = PageBlockType.TEXT;
    this.content = {
      value: TextPageBlockEntity.parseInitializerValue(initializer?.content.value),
    };
  }
  
  public replaceText(old_text: TextBlockText, new_text: TextBlockText) {
    if (this.content.value.id !== old_text.id) throw new Error("Could not find text in TextBlock.");
    this.content.value = new_text;
    return this;
  }
  
  private static parseInitializerValue(value?: TextBlockInitializer["content"]["value"]): RichText {
    if (!value) return new RichText();
    if (value instanceof RichText) return value;
    return new RichText(value);
  }
}

export type TextBlockText = RichText

export interface TextBlockContent {
  value: RichText;
}

export interface TextBlockInitializer extends PageBlockInitializer {
  content: {
    value: RichText | RichTextContent
  }
}
