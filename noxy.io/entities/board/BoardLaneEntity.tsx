import Entity from "../../classes/Entity";
import BoardCardEntity, {BoardCardEntityUpdateParameters} from "./BoardCardEntity";
import BoardCategoryEntity from "./BoardCategoryEntity";
import Axios from "axios";
import RequestData from "../../classes/RequestData";

export default class BoardLaneEntity<CardContent = any, LaneContent = any> extends Entity {

  public id: string;
  public content: LaneContent;
  public weight: number;
  public board_category: BoardCategoryEntity<CardContent, LaneContent>;
  public board_card_list: BoardCardEntity<CardContent, LaneContent>[];
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/board-lane`;

  constructor(entity?: Initializer<BoardLaneEntity<CardContent, LaneContent> & Pick<BoardLaneEntity, "content">>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.content = entity?.content ?? {};
    this.weight = entity?.weight ?? 0;
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
    const result = await Axios.post<APIRequest<BoardLaneEntity>>(this.URL, new RequestData({...parameters, content: JSON.stringify(parameters.content)}).toObject());
    return new this(result.data.content);
  }

  public static async moveOne(parameters: BoardLaneEntityMoveParameters) {
    return await Axios.post<APIRequest<boolean>>(`${this.URL}/move`, new RequestData(parameters).toObject());
  }

  public static async updateOne(id: string | BoardLaneEntity, parameters: BoardCardEntityUpdateParameters) {
    id = id instanceof BoardLaneEntity ? id.id : id;
    const result = await Axios.put<APIRequest<BoardLaneEntity>>(`${this.URL}/${id}`, new RequestData({...parameters, content: JSON.stringify(parameters.content)}).toObject());
    return new this(result.data.content);
  }

  public static async deleteOne(id: string | BoardCardEntity) {
    id = id instanceof BoardCardEntity ? id.id : id;
    const result = await Axios.delete<APIRequest<BoardLaneEntity>>(`${this.URL}/${id}`);
    return new this(result.data.content);
  }

}

export type BoardLaneEntityCreateParameters = {
  content?: JSONObject
  weight?: number
  board_category: string | BoardCategoryEntity
}

export type BoardLaneEntityMoveParameters = {
  board_lane: BoardLaneEntity
  board_category: BoardCategoryEntity
  weight: number
}
