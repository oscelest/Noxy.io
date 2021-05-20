import Entity from "../../classes/Entity";
import BoardLaneEntity from "./BoardLaneEntity";
import BoardEntity from "./BoardEntity";
import Order from "../../../common/enums/Order";
import Axios from "axios";
import RequestData from "../../classes/RequestData";

export default class BoardCategoryEntity<CardContent = any, LaneContent = any> extends Entity {

  public id: string;
  public name: string;
  public board: BoardEntity;
  public board_lane_list: BoardLaneEntity<CardContent, LaneContent>[];
  public time_created: Date;

  public static URL = `${Entity.domainAPI}/board-category`;

  constructor(entity?: EntityInitializer<BoardCategoryEntity<CardContent, LaneContent>>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.name = entity?.name ?? "";
    this.board = new BoardEntity(entity?.board);
    this.board_lane_list =  BoardLaneEntity.instantiate(entity?.board_lane_list);
    this.time_created = new Date(entity?.time_created ?? 0);
  }

  public toString() {
    return this.name;
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async findManyByBoard(board: string | BoardEntity, pagination: RequestPagination<BoardEntity> = {skip: 0, limit: 10, order: {time_created: Order.ASC}}) {
    const id = board instanceof BoardEntity ? board.id : board;
    const result = await Axios.get<APIRequest<BoardEntity[]>>(`${this.URL}/by-board/${id}?${new RequestData().paginate(pagination)}`);
    return this.instantiate(result.data.content);
  }

  public static async createOne(parameters: BoardCategoryEntityCreateParameters) {
    const result = await Axios.post<APIRequest<BoardCategoryEntity>>(this.URL, new RequestData(parameters).toObject());
    return new this(result.data.content);
  }

}

export type BoardCategoryEntityCreateParameters = {
  name: string
  board: string | BoardEntity
}
