import UserEntity from "../UserEntity";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";
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
    this.page_block_list = PageBlockEntity.instantiate(entity?.page_block_list);
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
