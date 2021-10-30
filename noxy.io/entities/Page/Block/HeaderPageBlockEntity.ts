import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText, {RichTextObject} from "../../../classes/RichText/RichText";
import RichTextSection from "../../../classes/RichText/RichTextSection";
import PageBlockEntity, {PageBlockInitializer} from "../PageBlockEntity";

export default class HeaderPageBlockEntity extends PageBlockEntity {
  
  public content: HeaderBlockContent;
  
  constructor(initializer?: HeaderBlockInitializer) {
    super(initializer);
    this.type = PageBlockType.HEADER;
    this.content = {
      value: HeaderPageBlockEntity.parseInitializerValue(initializer?.content.value),
    };
  }
  
  public replaceText(old_text: RichText, new_text: RichText): this {
    if (this.content.value.id !== old_text.id) throw new Error("Could not find text in HeaderBlock.");
    this.content.value = new_text;
    return this;
  }
  
  public static parseHeaderTag(tag: HTMLTag) {
    return ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag) ? tag : "h1";
  }
  
  private static parseInitializerValue(value?: HeaderBlockInitializer["content"]["value"]): RichText {
    if (!value) return new RichText({value: new RichTextSection({element: "h1"})});
    
    for (let i = 0; i < value.section_list.length; i++) {
      const item = value.section_list[i].element;
      if (item) value.section_list[i].element.splice(0, item.length, this.parseHeaderTag(item[0]));
    }
    
    return new RichText({
      value:   value.section_list.map(value => new RichTextSection(value)),
      element: value.element,
    });
  }
}

export interface HeaderBlockContent {
  value: RichText;
}

export interface HeaderBlockInitializer extends PageBlockInitializer {
  content: {
    value: RichText | RichTextObject
  };
}
