import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import PageBlockType from "../../../common/enums/PageBlockType";
import PageEntity from "./PageEntity";

export default class PageBlockEntity extends BaseEntity {
  
  public id: string;
  public content: object;
  public type: PageBlockType;
  public weight: number;
  public page: PageEntity;
  public time_created: Date;
  public time_updated: Date;
  
  public static URL = "page-block";
  
  constructor(entity?: Initializer<PageBlockEntity>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.type = entity?.type ?? PageBlockType.TEXT;
    this.content = entity?.content ?? {};
    this.weight = entity?.weight ?? 0;
    this.page = new PageEntity(entity?.page);
    this.time_created = new Date(entity?.time_created ?? 0);
    this.time_updated = new Date(entity?.time_updated ?? 0);
  }
  
  public toString() {
    return this.getPrimaryID();
  }
  
  public getPrimaryID(): string {
    return this.id;
  }
}