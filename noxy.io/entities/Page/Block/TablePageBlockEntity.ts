import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText from "../../../classes/RichText";
import PageBlockEntity, {ContentInitializer, PageBlockContentValue} from "../PageBlockEntity";

export default class TablePageBlockEntity extends PageBlockEntity {
  
  public content: TableBlockContent;
  
  constructor(initializer?: Omit<Initializer<TablePageBlockEntity>, "type">) {
    super(initializer);
    this.type = PageBlockType.TABLE;
    this.content = initializer?.content ?? {
      value: [
        [new RichText({value: ""}), new RichText({value: ""})],
        [new RichText({value: ""}), new RichText({value: ""})],
      ],
    };
  }
  
  public replaceText(old_text: TableBlockText, new_text: TableBlockText): this {
    for (let y = 0; y < this.content.value.length; y++) {
      for (let x = 0; x < this.content.value[y].length; x++) {
        if (this.content.value[y][x].id !== old_text.id) continue;
        this.content.value[y][x] = new_text;
        return this;
      }
    }
    throw new Error("Could not find text in TableBlock.");
  }
  
  public static parseContent(content?: ContentInitializer<TableBlockContent>): TableBlockContent {
    const {value} = content ?? {};
    const table = [] as TableBlockText[][];
    
    const y_max = value?.length ?? 2;
    for (let y = 0; y < y_max; y++) {
      table[y] = [];
      
      const x_max = value?.[y]?.length ?? 2;
      for (let x = 0; x < x_max; x++) {
        table[y][x] = this.parseContentText(value?.[y]?.[x]);
      }
    }
    
    return {value: table};
  }
  
}

export type TableBlockText = RichText

export interface TableBlockContent extends PageBlockContentValue {
  value: TableBlockText[][];
}
