import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import PageBlockType from "../../../common/enums/PageBlockType";
import PageEntity from "./PageEntity";
import RichText from "../../classes/RichText";

export default class PageBlockEntity<Type extends PageBlockType = PageBlockType> extends BaseEntity {

  public id: string;
  public content: PageBlockContentOutput[Type];
  public type: Type;
  public weight: number;
  public page: PageEntity;
  public time_created: Date;
  public time_updated: Date;

  public static URL = "page-block";

  constructor(entity?: Initializer<PageBlockEntity<Type>> & {type?: Type, content?: PageBlockContentInput[Type]}) {
    super();
    this.id = entity?.id ?? BaseEntity.defaultID;
    this.type = entity?.type ?? PageBlockType.UNKNOWN as Type;
    this.content = PageBlockEntity.parseContent(this.type, entity?.content);
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

  public static parseContent<Type extends PageBlockType>(type: Type, content?: PageBlockContentInput[Type]): PageBlockContentOutput[Type] {
    switch (type) {
      case PageBlockType.HEADER:
        return {text: "", size: 0} as PageBlockContentOutput[typeof type];
      case PageBlockType.TABLE:
        return content as PageBlockContentOutput[typeof type];
      case PageBlockType.TEXT:
        return content as PageBlockContentOutput[typeof type];
      case PageBlockType.UNKNOWN:
        return content as PageBlockContentOutput[typeof type];
    }
    throw `Could not parse type '${type}'`;
  }
}

type Text = RichText;

export interface PageBlockContentInput {
  [PageBlockType.UNKNOWN]: object;
  [PageBlockType.TEXT]: Text;
  [PageBlockType.HEADER]: {text: Text, size: number};
  [PageBlockType.TABLE]: Text[][];
}

export interface PageBlockContentOutput {
  [PageBlockType.UNKNOWN]: object;
  [PageBlockType.TEXT]: Text;
  [PageBlockType.HEADER]: {text: Text, size: number};
  [PageBlockType.TABLE]: Text[][];
}
