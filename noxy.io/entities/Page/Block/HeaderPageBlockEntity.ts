import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText from "../../../classes/RichText/RichText";
import RichTextSection from "../../../classes/RichText/RichTextSection";
import PageBlockEntity from "../PageBlockEntity";

export default class HeaderPageBlockEntity extends PageBlockEntity {
  
  public content: HeaderBlockContent;
  
  constructor(initializer?: Omit<Initializer<HeaderPageBlockEntity>, "type">) {
    super(initializer);
    this.type = PageBlockType.HEADER;
    this.content = initializer?.content ?? {
      value: new RichText({value: new RichTextSection({element: "h1"})}),
    };
  }
  
  public replaceText(old_text: HeaderBlockText, new_text: HeaderBlockText): this {
    if (this.content.value.id !== old_text.id) throw new Error("Could not find text in HeaderBlock.");
    this.content.value = new_text;
    return this;
  }
}

export type HeaderBlockText = RichText

export interface HeaderBlockContent {
  value: HeaderBlockText;
}
