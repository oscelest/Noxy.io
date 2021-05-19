import Entity from "../../classes/Entity";
import BoardLaneEntity from "./BoardLaneEntity";
import Axios from "axios";
import BoardCategoryEntity from "./BoardCategoryEntity";
import RequestData from "../../classes/RequestData";

export default class BoardCardEntity extends Entity {

  public id: string;
  public content: JSONObject;
  public board_lane: BoardLaneEntity;
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/board-card`;

  constructor(entity?: EntityInitializer<BoardCardEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.content = entity?.content ?? null;
    this.board_lane = new BoardLaneEntity(entity?.board_lane);
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return JSON.stringify(this.content);
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async createOne(parameters: BoardCardEntityCreateParameters) {
    const result = await Axios.post<APIRequest<BoardCategoryEntity>>(this.URL, new RequestData(parameters).toObject());
    return new this(result.data.content);
  }

}

export type BoardCardEntityCreateParameters = {
  content: JSONObject
  board_category: string | BoardCategoryEntity
  board_lane: string | BoardLaneEntity;
}
