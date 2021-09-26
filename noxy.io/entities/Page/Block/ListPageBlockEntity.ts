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
      value: [
        new RichText({value: "", metadata: 1}),
      ],
      data:  {type: "unordered"},
    };
  }
  
  public replaceText(old_text: ListBlockText, new_text: ListBlockText): this {
    for (let i = 0; i < this.content.value.length; i++) {
        if (this.content.value[i].id !== old_text.id) continue;
        this.content.value[i] = new_text;
        return this;
    }
    throw new Error("Could not find text in ListBlock.");
  }
  
  public static parseContent(content?: ContentInitializer<ListBlockContent>): ListBlockContent {
    const {value, data} = content ?? {};
    
    return {
      value: Array.isArray(value) ? value.map(this.parseContentText) : [new RichText({value: "", metadata: 1})],
      data:  {
        type: typeof data?.type === "string" && this.type_list.includes(data.type) ? data.type : "ordered",
      },
    };
  }
}

export type ListBlockText = RichText<number>
export type ListBlockType = "blockquote" | "ordered" | "unordered"

export interface ListBlockContent extends PageBlockContentValue<number> {
  value: ListBlockText[];
  data: {
    type: ListBlockType
  };
}
