import Entity from "../../classes/Entity";
import BoardLaneEntity from "./BoardLaneEntity";
import Axios from "axios";
import RequestData from "../../classes/RequestData";

export default class BoardCardEntity<CardContent = any, LaneContent = any> extends Entity {

  public id: string;
  public content: CardContent;
  public weight: number;
  public board_lane: BoardLaneEntity<CardContent, LaneContent>;
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/board-card`;

  constructor(entity?: Initializer<BoardCardEntity<CardContent, LaneContent> & Pick<BoardCardEntity, "content">>) {
    super();

    this.id = entity?.id ?? Entity.defaultID;
    this.content = entity?.content ?? {};
    this.weight = entity?.weight ?? 0;
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
    const result = await Axios.post<APIRequest<BoardCardEntity>>(this.URL, new RequestData({...parameters, content: JSON.stringify(parameters.content)}).toObject());
    return new this(result.data.content);
  }

  public static async moveOne(parameters: BoardCardEntityMoveParameters) {
    return await Axios.post<APIRequest<boolean>>(`${this.URL}/move`, new RequestData(parameters).toObject());
  }

  public static async updateOne<C extends JSONObject = JSONObject>(id: string | BoardCardEntity, data: BoardCardEntityUpdateParameters) {
    id = id instanceof BoardCardEntity ? id.id : id;
    const result = await Axios.put<APIRequest<BoardCardEntity>>(`${this.URL}/${id}`, new RequestData({...data, content: JSON.stringify(data.content)}).toObject());
    return new this(result.data.content);
  }

  public static async deleteOne(id: string | BoardCardEntity) {
    id = id instanceof BoardCardEntity ? id.id : id;
    const result = await Axios.delete<APIRequest<BoardCardEntity>>(`${this.URL}/${id}`);
    return new this(result.data.content);
  }

}

export type BoardCardEntityCreateParameters = {
  content?: JSONObject
  weight?: number
  board_lane: string | BoardLaneEntity;
}

export type BoardCardEntityMoveParameters = {
  board_card: BoardCardEntity
  board_lane: BoardLaneEntity
  weight: number
}

export type BoardCardEntityUpdateParameters = {
  content?: JSONObject
}