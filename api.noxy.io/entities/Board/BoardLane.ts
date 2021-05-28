import * as TypeORM from "typeorm";
import Entity from "../../../common/classes/Entity";
import BoardCard, {BoardCardJSON} from "./BoardCard";
import BoardCategory, {BoardCategoryJSON} from "./BoardCategory";
import ValidatorType from "../../../common/enums/ValidatorType";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";
import Board from "./Board";
import _ from "lodash";

@TypeORM.Entity()
export default class BoardLane extends Entity<BoardLane>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "int"})
  public weight: number;

  @TypeORM.Column({type: "json"})
  public content: string;

  @TypeORM.ManyToOne(() => BoardCategory, entity => entity.board_lane_list, {nullable: false, onDelete: "CASCADE", onUpdate: "CASCADE"})
  @TypeORM.JoinColumn({name: "board_category_id"})
  public board_category: BoardCategory;

  @TypeORM.Column({type: "varchar", length: 36})
  public board_category_id: string;

  @TypeORM.OneToMany(() => BoardCard, entity => entity.board_lane)
  @TypeORM.JoinColumn({name: "user_id"})
  public board_card_list: BoardCard[];

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, select: false, default: null})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  public toJSON(): BoardLaneJSON {
    return {
      id:              this.id,
      content:         this.content,
      weight:          this.weight,
      board_category:  this.board_category.toJSON(),
      board_card_list: _.map(this.board_card_list, entity => entity.toJSON()),
      time_created:    this.time_created,
    };
  }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "board_card_list");
    this.join(query, "board_category");
    return query;
  }

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @BoardLane.post("/")
  @BoardLane.bindParameter<Request.postCreateOne>("content", ValidatorType.STRING, {min_length: 1}, {flag_optional: true})
  @BoardLane.bindParameter<Request.postCreateOne>("weight", ValidatorType.INTEGER, {min: 0}, {flag_optional: true})
  @BoardLane.bindParameter<Request.postCreateOne>("board_category", ValidatorType.UUID)
  private static async createOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {content, weight, board_category} = parameters!;
    const entity = TypeORM.getRepository(BoardLane).create();

    try {
      entity.board_category = await BoardCategory.performSelect(board_category);
      if (user?.id !== entity.board_category.board.user_created_id) return respond?.(new ServerException(403));

      entity.content = content ?? JSON.stringify("New lane");
      entity.weight = weight ?? entity.board_category.board_lane_list.length;
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

  @BoardLane.post("/move")
  @BoardLane.bindParameter<Request.postMoveOne>("board_lane", ValidatorType.UUID)
  @BoardLane.bindParameter<Request.postMoveOne>("weight", ValidatorType.INTEGER, {min: 0})
  private static async moveOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postMoveOne, Request.postMoveOne>) {
    const {board_lane, weight} = parameters!;
    const query = BoardLane.createSelect();

    try {
      this.join(query, "board_category", "board");
      this.join(query, "board_category", "board_lane_list");
      this.addValueClause(query, "id", board_lane);

      const entity = await query.getOneOrFail();
      if (entity.board_category.board.user_created_id !== user!.id) return respond?.(new ServerException(403));

      const direction = entity.weight < weight ? 1 : -1;
      const start = Math.min(weight, entity.weight + direction);
      const end = Math.max(weight, entity.weight + direction);

      for (let lane of entity.board_category.board_lane_list) lane.weight >= start && lane.weight <= end && await this.performUpdate(lane.id, {weight: lane.weight - direction});
      await this.performUpdate(entity.id, {weight});

      return respond?.(true);
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @BoardCard.put("/:id")
  @BoardCard.bindParameter<Request.putUpdateOne>("content", ValidatorType.STRING)
  private static async updateOne({params: {id}, locals: {respond, user, parameters}}: Server.Request<{id: string}, Response.putUpdateOne, Request.putUpdateOne>) {
    try {
      const entity = await this.performSelect(id);
      const board = await Board.performSelect(entity.board_category.board_id);
      if (user?.id !== board.user_created_id) return respond?.(new ServerException(403));

      return respond?.(await this.performUpdate(id, parameters!));
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @BoardCard.delete("/:id")
  private static async deleteOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.deleteDeleteOne, Request.deleteDeleteOne>) {
    try {
      const entity = await this.performSelect(id);
      const board_category = await BoardCategory.performSelect(entity.board_category.id);
      if (user?.id !== board_category.board.user_created_id) return respond?.(new ServerException(403));

      return respond?.(await this.performDelete(id));
    }
    catch (error) {
      return respond?.(error);
    }
  }

  //endregion ----- Endpoint methods -----

}

export type BoardLaneJSON = {
  id: string
  content: string
  weight: number
  board_category: BoardCategoryJSON
  board_card_list: BoardCardJSON[]
  time_created: Date
}


namespace Request {
  export type postCreateOne = {content?: string, weight?: number, board_category: string}
  export type postMoveOne = {board_lane: string, weight: number}
  export type putUpdateOne = {content?: string}
  export type deleteDeleteOne = never
}

namespace Response {
  export type postCreateOne = BoardLane | ServerException
  export type postMoveOne = boolean | ServerException
  export type putUpdateOne = BoardLane | ServerException
  export type deleteDeleteOne = BoardLane | ServerException
}
