import * as TypeORM from "typeorm";
import Entity from "../../../common/classes/Entity";
import BoardLane, {BoardLaneJSON} from "./BoardLane";
import BoardCategory from "./BoardCategory";
import ValidatorType from "../../../common/enums/ValidatorType";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";

@TypeORM.Entity()
export default class BoardCard extends Entity<BoardCard>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "json"})
  public content: string;

  @TypeORM.ManyToOne(() => BoardLane, entity => entity.board_card_list, {nullable: false, onDelete: "RESTRICT", onUpdate: "CASCADE"})
  @TypeORM.JoinColumn({name: "board_lane_id"})
  public board_lane: BoardLane;
  public board_lane_id: string;

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, select: false, default: null})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  public toJSON(): BoardCardJSON {
    return {
      id:           this.id,
      content:      this.content,
      board_lane:   this.board_lane,
      time_created: this.time_created,
    };
  }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "board_lane");
    return query;
  }

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @BoardCard.post("/")
  @BoardCard.bindParameter<Request.postCreateOne>("content", ValidatorType.STRING)
  @BoardCard.bindParameter<Request.postCreateOne>("board_category", ValidatorType.UUID)
  @BoardCard.bindParameter<Request.postCreateOne>("board_lane", ValidatorType.UUID)
  private static async createOne({locals: {respond, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {board_category, board_lane, content} = parameters!;
    const entity = TypeORM.getRepository(BoardCard).create();

    entity.content = content;

    try {
      entity.board_lane = await BoardLane.performSelect(board_lane);
    }
    catch (error) {
      return respond?.(error);
    }

    try {
      const board_category_entity = await BoardCategory.performSelect(board_category);
      if (board_category_entity.id !== entity.board_lane.board_category.id) return respond?.(new ServerException(403, {board_category}));
    }
    catch (error) {
      return respond?.(error);
    }

    try {
      return respond?.(await this.performInsert(entity));
    }
    catch (error) {
      if (error.code === "ER_DUP_ENTRY") return respond?.(new ServerException(409, {name: content}));
      return respond?.(error);
    }
  }

  //endregion ----- Endpoint methods -----

}

export type BoardCardJSON = {
  id: string
  content: string
  board_lane: BoardLaneJSON
  time_created: Date
}

namespace Request {
  export type postCreateOne = {content: string, board_category: string, board_lane: string}
}

namespace Response {
  export type postCreateOne = BoardCard | ServerException
}
