import Entity from "../../classes/Entity";
import BoardCardEntity from "./BoardCardEntity";
import BoardCategoryEntity from "./BoardCategoryEntity";
import Axios from "axios";
import RequestData from "../../classes/RequestData";

export default class BoardLaneEntity<LaneContent = any, CardContent = any> extends Entity {

  public id: string;
  public content: LaneContent;
  public board_category: BoardCategoryEntity<CardContent, LaneContent>;
  public board_card_list: BoardCardEntity<CardContent>[];
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
    return JSON.stringify(this.content);
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async createOne(parameters: BoardLaneEntityCreateParameters) {
    const result = await Axios.post<APIRequest<BoardCategoryEntity>>(this.URL, new RequestData(parameters).toObject());
    return new this(result.data.content);
  }

}

export type BoardLaneEntityCreateParameters<Content extends JSONObject = JSONObject> = {
  content: Content
  board_category: string | BoardCategoryEntity
}
