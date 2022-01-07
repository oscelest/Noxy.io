import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import UserEntity from "../UserEntity";
import PageBlockEntity from "./PageBlockEntity";

export default class PageEntity extends BaseEntity {

  public id: string;
  public url: string;
  public name: string;
  public content: any;
  public page_block_list: PageBlockEntity[];
  public user: UserEntity;
  public time_created: Date;

  public static URL = "page";

  constructor(entity?: Initializer<PageEntity>) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.name = entity?.name ?? "";
    this.url = entity?.url ?? "";
    this.content = entity?.content;
    this.page_block_list = entity?.page_block_list?.map(block => new PageBlockEntity(block)) ?? [];
    this.user = new UserEntity(entity?.user);
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return this.getPrimaryID();
  }

  public getPrimaryID(): string {
    return this.id;
  }

}
