import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText from "../../../classes/RichText";
import PageBlockEntity, {ContentInitializer, PageBlockContentValue} from "../PageBlockEntity";

export default class HeaderPageBlockEntity extends PageBlockEntity {
  
  public content: HeaderBlockContent;
  
  constructor(initializer?: Omit<Initializer<HeaderPageBlockEntity>, "type">) {
    super(initializer);
    this.type = PageBlockType.HEADER;
    this.content = initializer?.content ?? {
      value: new RichText({value: ""}),
      data:  {
        level: 1,
      },
    };
  }
  
  public replaceText(old_text: HeaderBlockText, new_text: HeaderBlockText): this {
    if (this.content.value.id !== old_text.id) throw new Error("Could not find text in HeaderBlock.");
    this.content.value = new_text;
    return this;
  }
  
  public static parseContent(content?: ContentInitializer<HeaderBlockContent>): HeaderBlockContent {
    const {value, data} = content ?? {};
    
    return {
      value: this.parseContentText(value),
      data: {
        level: this.parseContentNumber(data?.level)
      }
    };
  }
  
}

export type HeaderBlockText = RichText

export interface HeaderBlockContent extends PageBlockContentValue {
  value: HeaderBlockText;
  data: {
    level: number
  };
}
