import Entity from "../../classes/Entity";
import BoardLaneEntity from "./BoardLaneEntity";
import Axios from "axios";
import RequestData from "../../classes/RequestData";

export default class BoardCardEntity<CardContent = any, LaneContent = any> extends Entity {

  public id: string;
  public content: CardContent;
  public board_lane: BoardLaneEntity<LaneContent>;
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/board-card`;

  constructor(entity?: EntityInitializer<BoardCardEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.content = entity?.content ?? "";
    this.board_lane = new BoardLaneEntity(entity?.board_lane);
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return JSON.stringify(this.content);
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async createOne<C extends JSONObject = JSONObject>(parameters: BoardCardEntityCreateParameters<C>) {
    const result = await Axios.post<APIRequest<BoardCardEntity<C>>>(this.URL, new RequestData(parameters).toObject());
    return new this(result.data.content);
  }

  public static async updateOne<C extends JSONObject = JSONObject>(id: string | BoardCardEntity, data: BoardCardEntityUpdateParameters<C>) {
    id = id instanceof BoardCardEntity ? id.id : id;
    const result = await Axios.put<APIRequest<BoardCardEntity>>(`${this.URL}/${id}`, new RequestData({...data, content: JSON.stringify(data.content)}).toObject());
    return new this(result.data.content);
  }

}

export type BoardCardEntityCreateParameters<Content extends JSONObject = JSONObject> = {
  content: Content
  board_lane: string | BoardLaneEntity;
}

export type BoardCardEntityUpdateParameters<Content extends JSONObject = JSONObject> = {
  content?: Content
}
