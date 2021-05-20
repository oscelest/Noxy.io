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

  @TypeORM.Column({type: "varchar", length: 36})
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
  private static async createOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {board_lane, content} = parameters!;
    const entity = TypeORM.getRepository(BoardCard).create();

    try {
      entity.content = content;
      entity.board_lane = await BoardLane.performSelect(board_lane);
      entity.board_lane.board_category = await BoardCategory.performSelect(entity.board_lane.board_category.id);
      if (user?.id !== entity.board_lane.board_category.board.user_created.id) return respond?.(new ServerException(403));
      return respond?.(await this.performInsert(entity));
    }
    catch (error) {
      if (error.code === "ER_DUP_ENTRY") return respond?.(new ServerException(409, {name: content}));
      return respond?.(error);
    }
  }

  @BoardCard.put("/:id")
  @BoardCard.bindParameter<Request.putUpdateOne>("content", ValidatorType.STRING)
  private static async updateOne({params: {id}, locals: {respond, user, parameters}}: Server.Request<{id: string}, Response.putUpdateOne, Request.putUpdateOne>) {
    try {
      const entity = await this.performSelect(id);
      const board_lane = await BoardLane.performSelect(entity.board_lane.id);
      const board_category = await BoardCategory.performSelect(board_lane.board_category.id);
      if (user?.id !== board_category.board.user_created_id) return respond?.(new ServerException(403));

      return respond?.(await this.performUpdate(id, parameters!));
    }
    catch (error) {
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
  export type putUpdateOne = {content?: string}
}

namespace Response {
  export type postCreateOne = BoardCard | ServerException
  export type putUpdateOne = BoardCard | ServerException
}
