import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText, {RichTextObject} from "../../../classes/RichText/RichText";
import RichTextSection, {RichTextSectionContent} from "../../../classes/RichText/RichTextSection";
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
  
  public replaceText(old_text: RichText, new_text: RichText) {
    if (this.content.value.id !== old_text.id) throw new Error("Could not find text in TextBlock.");
    this.content.value = new_text;
    return this;
  }
  
  private static parseInitializerValue(value?: TextBlockInitializer["content"]["value"]) {
    return new RichText({
      element:      "div",
      section_list: this.parseSectionList(value?.section_list),
    });
  }
  
  private static parseSectionList(section_list?: RichTextSection[] | RichTextSectionContent[]) {
    return section_list ? section_list.map(value => new RichTextSection({...value, element: "p"})) : [new RichTextSection({element: "p"})];
  }
}

export interface TextBlockContent {
  value: RichText;
}

export interface TextBlockInitializer extends PageBlockInitializer {
  content: {
    value: RichText | RichTextObject
  };
}
