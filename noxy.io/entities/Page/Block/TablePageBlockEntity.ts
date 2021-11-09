import PageBlockType from "../../../../common/enums/PageBlockType";
import RichText, {RichTextObject} from "../../../classes/RichText/RichText";
import RichTextSection, {RichTextSectionContent} from "../../../classes/RichText/RichTextSection";
import PageBlockEntity, {PageBlockInitializer} from "../PageBlockEntity";

export default class TablePageBlockEntity extends PageBlockEntity {
  
  public content: TableBlockContent;
  
  constructor(initializer?: TableBlockInitializer) {
    super(initializer);
    this.type = PageBlockType.TABLE;
    this.content = TablePageBlockEntity.parseInitializerContent(initializer?.content);
  }
  
  public replaceText(old_text: RichText, new_text: RichText): this {
    for (let y = 0; y < this.content.value.length; y++) {
      for (let x = 0; x < this.content.value[y].length; x++) {
        if (this.content.value[y][x].id !== old_text.id) continue;
        this.content.value[y][x] = new_text;
        return this;
      }
    }
    
    throw new Error("Could not find text in TableBlock.");
  }
  
  private static parseInitializerContent(content?: TableBlockInitializer["content"]) {
    const table = {value: [], x: content?.x ?? 1, y: content?.y ?? 1} as TableBlockContent;
    if (!content) return table;
    
    for (let y = 0; y < content.y; y++) {
      table.value[y] = [];
      const row = content.value.at(y);
      
      if (row) {
        for (let x = 0; x < content.x; x++) {
          const column = row.at(x);
          if (column) {
            table.value[y][x] = new RichText({
              section_list: this.parseSectionList(column.section_list),
            });
          }
          else {
            table.value[y][x] = new RichText({section_list: [new RichTextSection()]});
          }
        }
      }
      else {
        for (let x = 0; x < content.x; x++) {
          table.value[y][x] = new RichText({section_list: [new RichTextSection()]});
        }
      }
    }
    
    return table;
  }
  
  private static parseSectionList(section_list?: RichTextSection[] | RichTextSectionContent[]) {
    return section_list ? section_list.map(value => new RichTextSection({...value, element: "p"})) : [new RichTextSection({element: "p"})];
  }
}

export interface TableBlockContent {
  value: RichText[][];
  x: number;
  y: number;
}

export interface TableBlockInitializer extends PageBlockInitializer {
  content: {
    value: RichText[][] | RichTextObject[][]
    x: number
    y: number
  };
}
