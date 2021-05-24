import Entity from "../../classes/Entity";
import UserEntity from "../UserEntity";
import BoardCategoryEntity from "./BoardCategoryEntity";
import Axios from "axios";
import RequestData from "../../classes/RequestData";
import Order from "../../../common/enums/Order";
import BoardType from "../../../common/enums/BoardType";

export default class BoardEntity extends Entity {

  public id: string;
  public name: string;
  public type: BoardType;
  public board_category_list: BoardCategoryEntity[];
  public user_created: UserEntity;
  public time_created: Date;
  public time_updated: Date;

  public static URL = `${Entity.domainAPI}/board`;

  constructor(entity?: EntityInitializer<BoardEntity>) {
    super();
    this.id = entity?.id ?? Entity.defaultID;
    this.name = entity?.name ?? "";
    this.type = entity?.type ?? BoardType.UNKNOWN;
    this.board_category_list = BoardCategoryEntity.instantiate(entity?.board_category_list);
    this.user_created = entity?.user_created ?? new UserEntity();
    this.time_created = new Date(entity?.time_created ?? 0);
    this.time_updated = new Date(entity?.time_updated ?? 0);
  }

  public toString() {
    return this.name;
  }

  public getPrimaryKey(): string {
    return this.id;
  }

  public static async count(search: BoardEntitySearchParameters = {}) {
    const result = await Axios.get<APIRequest<number>>(`${this.URL}/count?${new RequestData(search)}`);
    return result.data.content;
  }

  public static async findMany(search: BoardEntitySearchParameters = {}, pagination: RequestPagination<BoardEntity> = {skip: 0, limit: 10, order: {time_created: Order.ASC}}) {
    const result = await Axios.get<APIRequest<BoardEntity[]>>(`${this.URL}?${new RequestData(search).paginate(pagination)}`);
    return this.instantiate(result.data.content);
  }

  public static async findOneByID(entity: string | BoardEntity) {
    const id = entity instanceof BoardEntity ? entity.id : entity;
    const result = await Axios.get<APIRequest<BoardEntity>>(`${this.URL}/${id}`);
    return new this (result.data.content);
  }

  public static async createOne(search: BoardEntitySearchParameters = {}) {
    const result = await Axios.post<APIRequest<BoardEntity>>(this.URL, new RequestData(search).toObject());
    return new this(result.data.content);
  }


}

export type BoardEntitySearchParameters = {
  name?: string
  exclude?: string | string[] | BoardEntity | BoardEntity[]
}

export type BoardEntityCreateParameters = {
  name: string
}
