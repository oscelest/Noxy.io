import * as TypeORM from "typeorm";
import Entity from "../../../common/classes/Entity";
import BoardLane, {BoardLaneJSON} from "./BoardLane";
import BoardCategory from "./BoardCategory";
import ValidatorType from "../../../common/enums/ValidatorType";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";
import Board from "./Board";

@TypeORM.Entity()
export default class BoardCard extends Entity<BoardCard>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "int"})
  public weight: number;

  @TypeORM.Column({type: "json"})
  public content: string;

  @TypeORM.ManyToOne(() => BoardLane, entity => entity.board_card_list, {nullable: false, onDelete: "CASCADE", onUpdate: "CASCADE"})
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
      weight:       this.weight,
      board_lane:   this.board_lane.toJSON(),
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
  @BoardCard.bindParameter<Request.postCreateOne>("content", ValidatorType.STRING, {min_length: 1}, {flag_optional: true})
  @BoardCard.bindParameter<Request.postCreateOne>("weight", ValidatorType.INTEGER, {min: 0}, {flag_optional: true})
  @BoardCard.bindParameter<Request.postCreateOne>("board_lane", ValidatorType.UUID)
  private static async createOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {content, weight, board_lane} = parameters!;
    const entity = TypeORM.getRepository(BoardCard).create();

    try {
      entity.board_lane = await BoardLane.performSelect(board_lane);
      entity.board_lane.board_category = await BoardCategory.performSelect(entity.board_lane.board_category.id);
      if (user?.id !== entity.board_lane.board_category.board.user_created_id) return respond?.(new ServerException(403));

      entity.content = content ?? JSON.stringify("New card");
      entity.weight = weight ?? entity.board_lane.board_card_list.length;

      return respond?.(await this.performInsert(entity));
    }
    catch (error) {
      if (error.code === "ER_DUP_ENTRY") return respond?.(new ServerException(409, {name: content}));
      return respond?.(error);
    }
  }

  @BoardCard.post("/move")
  @BoardCard.bindParameter<Request.postMoveOne>("board_card", ValidatorType.UUID)
  @BoardCard.bindParameter<Request.postMoveOne>("board_lane", ValidatorType.UUID, {flag_optional: true})
  @BoardCard.bindParameter<Request.postMoveOne>("weight", ValidatorType.INTEGER, {min: 0})
  private static async moveOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postMoveOne, Request.postMoveOne>) {
    const {board_card, board_lane, weight} = parameters!;
    const query = this.createSelect();

    try {
      this.join(query, "board_lane", "board_card_list");
      this.addValueClause(query, "id", board_card);

      const entity = await query.getOneOrFail();
      const category = await BoardCategory.performSelect(entity.board_lane.board_category_id);

      if (!board_lane || board_lane === entity.board_lane.id) {
        if (category.board.user_created_id !== user!.id) return respond?.(new ServerException(403));

        const direction = entity.weight < weight ? 1 : -1;
        const start = Math.min(weight, entity.weight + direction);
        const end = Math.max(weight, entity.weight + direction);

        for (let card of entity.board_lane.board_card_list) card.weight >= start && card.weight <= end && await this.performUpdate(card.id, {weight: card.weight - direction});
        await this.performUpdate(entity.id, {weight});
      }
      else {
        const next_lane = await BoardLane.performSelect(board_lane);
        const board = await Board.performSelect(next_lane.board_category.board_id);
        if (board.user_created_id !== user!.id) return respond?.(new ServerException(403));

        for (let card of entity.board_lane.board_card_list) card.weight <= entity.weight && await this.performUpdate(card.id, {weight: card.weight - 1});
        for (let card of next_lane.board_card_list) card.weight > entity.weight && await this.performUpdate(card.id, {weight: card.weight + 1});

        await this.performUpdate(entity.id, {weight, board_lane: next_lane});
      }

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
      const board_lane = await BoardLane.performSelect(entity.board_lane.id);
      const board_category = await BoardCategory.performSelect(board_lane.board_category.id);
      if (user?.id !== board_category.board.user_created_id) return respond?.(new ServerException(403));

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
      const board_lane = await BoardLane.performSelect(entity.board_lane.id);
      const board_category = await BoardCategory.performSelect(board_lane.board_category.id);
      if (user?.id !== board_category.board.user_created_id) return respond?.(new ServerException(403));

      return respond?.(await this.performDelete(id));
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
  weight: number
  board_lane: BoardLaneJSON
  time_created: Date
}

namespace Request {
  export type postCreateOne = {content?: string, weight?: number, board_lane: string}
  export type postMoveOne = {board_card: string, board_lane?: string, weight: number}
  export type putUpdateOne = {content?: string}
  export type deleteDeleteOne = never
}

namespace Response {
  export type postCreateOne = BoardCard | ServerException
  export type postMoveOne = boolean | ServerException
  export type putUpdateOne = BoardCard | ServerException
  export type deleteDeleteOne = BoardCard | ServerException
}
