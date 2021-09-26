import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import PageBlockType from "../../../common/enums/PageBlockType";
import UserEntity from "../UserEntity";
import HeaderPageBlockEntity from "./Block/HeaderPageBlockEntity";
import ListPageBlockEntity from "./Block/ListPageBlockEntity";
import TablePageBlockEntity from "./Block/TablePageBlockEntity";
import TextPageBlockEntity from "./Block/TextPageBlockEntity";
import PageBlockEntity from "./PageBlockEntity";

export default class PageEntity extends BaseEntity {
  
  public id: string;
  public url: string;
  public name: string;
  public page_block_list: PageBlockEntity[];
  public user: UserEntity;
  public time_created: Date;
  
  public static URL = "page";
  
  constructor(entity?: Initializer<PageEntity>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.name = entity?.name ?? "";
    this.url = entity?.url ?? "";
    this.page_block_list = entity?.page_block_list?.map(block => PageEntity.parsePageBlock(block)) ?? [];
    this.user = new UserEntity(entity?.user);
    this.time_created = new Date(entity?.time_created ?? 0);
  }
  
  public toString() {
    return this.getPrimaryID();
  }
  
  public getPrimaryID(): string {
    return this.id;
  }
  
  public static parsePageBlock(value: Properties<PageBlockEntity> & {content: any}) {
    switch (value.type) {
      case PageBlockType.TEXT:
        return new TextPageBlockEntity({...value, content: TextPageBlockEntity.parseContent(value.content)});
      case PageBlockType.LIST:
        return new ListPageBlockEntity({...value, content: ListPageBlockEntity.parseContent(value.content)});
      case PageBlockType.TABLE:
        return new TablePageBlockEntity({...value, content: TablePageBlockEntity.parseContent(value.content)});
      case PageBlockType.HEADER:
        return new HeaderPageBlockEntity({...value, content: HeaderPageBlockEntity.parseContent(value.content)});
    }
    
    throw new Error(`Page block entity of type '${value.type}' is invalid.`);
  }
  
  public static createPageBlock<T extends PageBlockType>(type: T, initializer?: Initializer<PageBlockEntity<T>>) {
    switch (type) {
      case PageBlockType.TEXT:
        return new TextPageBlockEntity(initializer);
      case PageBlockType.LIST:
        return new ListPageBlockEntity(initializer);
      case PageBlockType.TABLE:
        return new TablePageBlockEntity(initializer);
      case PageBlockType.HEADER:
        return new HeaderPageBlockEntity(initializer);
    }
    
    throw new Error(`Page block entity of type '${type}' is invalid.`);
  }
  
}
