import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText from "../../../classes/RichText/RichText";
import PageBlockEntity, {ContentInitializer, PageBlockContentValue} from "../PageBlockEntity";

export default class ListPageBlockEntity extends PageBlockEntity {
  
  public content: ListBlockContent;
  
  public static readonly type_list: ListBlockType[] = ["ordered", "unordered", "blockquote"];
  public static readonly indent_min: number = 0;
  public static readonly indent_max: number = 5;
  
  public static readonly default_text: string = "";
  public static readonly default_type: ListBlockType = "unordered";
  
  constructor(initializer?: Omit<Initializer<ListPageBlockEntity>, "type">) {
    super(initializer);
    this.type = PageBlockType.LIST;
    this.content = initializer?.content ?? {
      
      value: ListPageBlockEntity.createDefault(),
      data:  {type: ListPageBlockEntity.default_type},
    };
  }
  
  public replaceText(old_text: ListBlockText, new_text: ListBlockText): this {
    if (this.content.value.id !== old_text.id) throw new Error("Could not find text in ListBlock.");
    this.content.value = new_text;
    return this;
  }
  
  public static parseContent(content?: ContentInitializer<ListBlockContent>): ListBlockContent {
    const {value, data} = content ?? {};
    
    return {
      value: value ? this.parseContentText(value) : ListPageBlockEntity.createDefault(),
      data:  {
        type: typeof data?.type === "string" && this.type_list.includes(data.type) ? data.type : ListPageBlockEntity.default_type,
      },
    };
  }
  
  public static createDefault() {
    return new RichText({
      value:    ListPageBlockEntity.default_text,
      metadata: [
        {indent: ListPageBlockEntity.indent_min},
      ],
    });
  }
}

export type ListBlockData = {indent: number, group?: number}[]
export type ListBlockText = RichText<ListBlockData>
export type ListBlockType = "blockquote" | "ordered" | "unordered"

export interface ListBlockContent extends PageBlockContentValue<ListBlockData> {
  value: ListBlockText;
  data: {
    type: ListBlockType
  };
}
