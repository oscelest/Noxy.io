import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText, {RichTextObject} from "../../../classes/RichText/RichText";
import RichTextSection, {RichTextSectionContent} from "../../../classes/RichText/RichTextSection";
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
  
  public replaceText(old_text: RichText, new_text: RichText) {
    if (this.content.value.id !== old_text.id) throw new Error("Could not find text in HeaderBlock.");
    this.content.value = new_text;
    return this;
  }
  
  private static parseInitializerValue(value?: HeaderBlockInitializer["content"]["value"]) {
    return new RichText({
      element:      this.parseElement(value?.element),
      section_list: this.parseSectionList(value?.section_list),
    });
  }
  
  private static parseElement(tag?: HTMLTag) {
    switch (tag) {
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return tag;
      default:
        return "h1";
    }
  }
  
  private static parseSectionList(section_list?: RichTextSection[] | RichTextSectionContent[]) {
    return section_list ? section_list.map(value => new RichTextSection({...value, element: "div"})) : [new RichTextSection({element: "div"})];
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
