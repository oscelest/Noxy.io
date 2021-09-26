import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText from "../../../classes/RichText";
import PageBlockEntity, {ContentInitializer, PageBlockContentValue} from "../PageBlockEntity";

export default class TextPageBlockEntity extends PageBlockEntity {
  
  public content: TextBlockContent;
  
  constructor(initializer?: Omit<Initializer<TextPageBlockEntity>, "type">) {
    super(initializer);
    this.type = PageBlockType.TEXT;
    this.content = initializer?.content ?? {
      value: new RichText({value: ""}),
    };
  }
  
  public replaceText(old_text: TextBlockText, new_text: TextBlockText): this {
    if (this.content.value.id !== old_text.id) throw new Error("Could not find text in TextBlock.");
    this.content.value = new_text;
    return this;
  }
  
  public static parseContent(content?: ContentInitializer<TextBlockContent>): TextBlockContent {
    const {value} = content ?? {};
    
    return {
      value: this.parseContentText(value),
    };
  }
}

export type TextBlockText = RichText

export interface TextBlockContent extends PageBlockContentValue {
  value: TextBlockText;
}
