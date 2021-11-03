import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText, {RichTextObject} from "../../../classes/RichText/RichText";
import RichTextSection, {RichTextSectionContent} from "../../../classes/RichText/RichTextSection";
import ListBlock from "../../../components/Block/ListBlock";
import PageBlockEntity, {PageBlockInitializer} from "../PageBlockEntity";

export default class ListPageBlockEntity extends PageBlockEntity {
  
  public content: ListBlockContent;
  
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
      section_list: this.parseSectionList(value?.section_list, value?.element),
    });
  }
  
  private static parseElement(tag?: HTMLTag) {
    if (!tag) return ListBlock.default_tag;
    
    switch (tag) {
      case "blockquote":
      case "ol":
      case "ul":
        return tag;
      default:
        throw new Error("ListPageBlockEntity element tag must be either 'blockquote', 'ol', or 'ul'");
    }
  }
  
  private static parseSectionList(section_list?: RichTextSection[] | RichTextSectionContent[], parent: HTMLTag = ListBlock.default_tag) {
    if (!section_list) {
      if (parent === "blockquote") {
        return [new RichTextSection({element: "blockquote"})];
      }
      
      return [new RichTextSection({element: "li"})];
    }

    if (parent === "blockquote") {
      return section_list.map(value => new RichTextSection({...value, element: value.element.fill("blockquote")}));
    }
  
    return section_list.map(value => new RichTextSection({...value, element: [...value.element.slice(0, -1).fill(parent), ...value.element.slice(-1)]}));
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
