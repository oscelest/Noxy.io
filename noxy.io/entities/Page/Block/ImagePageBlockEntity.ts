import PageBlockType from "../../../../common/enums/PageBlockType";
import PageBlockEntity from "../PageBlockEntity";

export default class ImagePageBlockEntity extends PageBlockEntity<PageBlockType.IMAGE> {

  public content: ImageBlockContent;

  constructor(initializer?: TextBlockInitializer) {
    super(initializer);
    this.type = PageBlockType.IMAGE;
    this.content = {
      value: initializer?.content.value ?? "",
    };
  }

  public replaceValue(old_value: string, new_value: string) {
    this.content.value = new_value;
    return this;
  }
}

export interface ImageBlockContent {
  value: string;
}

export interface TextBlockInitializer extends PageBlockInitializer {
  content: {
    value: string
  };
}
