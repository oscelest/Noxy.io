import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText, {RichTextObject} from "../../../classes/RichText/RichText";
import RichTextSection, {RichTextSectionContent} from "../../../classes/RichText/RichTextSection";
import PageBlockEntity, {PageBlockInitializer} from "../PageBlockEntity";

export default class ListPageBlockEntity extends PageBlockEntity {
  
  public content: ListBlockContent;
  
  public static readonly indent_min: number = 0;
  public static readonly indent_max: number = 5;
  
  constructor(initializer?: ListBlockInitializer) {
    super(initializer);
    this.type = PageBlockType.LIST;
    this.content = {
      value: ListPageBlockEntity.parseInitializerValue(initializer?.content.value),
    };
  }
  
  public replaceText(old_text: RichText, new_text: RichText): this {
    if (this.content.value.id !== old_text.id) throw new Error("Could not find text in ListBlock.");
    this.content.value = new_text;
    return this;
  }
  
  private static parseInitializerValue(value?: ListBlockInitializer["content"]["value"]) {
    return new RichText({
      element:      this.parseElement(value?.element),
      section_list: this.parseSectionList(value?.section_list),
    });
  }
  
  private static parseElement(tag?: HTMLTag) {
    switch (tag) {
      case "blockquote":
      case "ol":
        return tag;
      default:
        return "ul";
    }
  }
  
  private static parseSectionList(section_list?: RichTextSection[] | RichTextSectionContent[], blockquote: boolean = false) {
    const element = blockquote ? "blockquote" : "li";
    if (!section_list) {
      return [new RichTextSection({element})];
    }
    
    return section_list.map(value => new RichTextSection({...value, element}));
  }
}

export interface ListBlockContent {
  value: RichText;
}

export interface ListBlockInitializer extends PageBlockInitializer {
  content: {
    value: RichText | RichTextObject
  };
}
