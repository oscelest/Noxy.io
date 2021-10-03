import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText from "../../../classes/RichText";
import PageBlockEntity, {ContentInitializer, PageBlockContentValue} from "../PageBlockEntity";

export default class ListPageBlockEntity extends PageBlockEntity {
  
  public content: ListBlockContent;
  
  public static readonly type_list: ListBlockType[] = ["blockquote", "ordered", "unordered"];
  
  constructor(initializer?: Omit<Initializer<ListPageBlockEntity>, "type">) {
    super(initializer);
    this.type = PageBlockType.LIST;
    this.content = initializer?.content ?? {
      value: new RichText({value: "", metadata: [{indent: 0}]}),
      data:  {type: "unordered"},
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
      value: value ? this.parseContentText(value) : new RichText({value: "", metadata: [{indent: 0}]}),
      data:  {
        type: typeof data?.type === "string" && this.type_list.includes(data.type) ? data.type : "ordered",
      },
    };
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
