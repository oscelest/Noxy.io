import Entity from "../../classes/Entity";
import BoardCardEntity from "./BoardCardEntity";
import BoardCategoryEntity from "./BoardCategoryEntity";
import Axios from "axios";
import RequestData from "../../classes/RequestData";

export default class BoardLaneEntity extends Entity {

  public id: string;
  public content: string;
  public board_category: BoardCategoryEntity;
  public board_card_list: BoardCardEntity[];
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/board-lane`;

  constructor(entity?: EntityInitializer<BoardLaneEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.content = entity?.content ?? "";
    this.board_category = new BoardCategoryEntity(entity?.board_category);
    this.board_card_list = BoardCardEntity.instantiate(entity?.board_card_list);
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return this.content;
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async createOne(parameters: BoardLaneEntityCreateParameters) {
    const result = await Axios.post<APIRequest<BoardCategoryEntity>>(this.URL, new RequestData(parameters).toObject());
    return new this(result.data.content);
  }

}

export type BoardLaneEntityCreateParameters = {
  content: string
  board_category: string | BoardCategoryEntity
}
