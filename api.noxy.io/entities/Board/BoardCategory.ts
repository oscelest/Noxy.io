import * as TypeORM from "typeorm";
import Entity, {Pagination} from "../../../common/classes/Entity";
import Board, {BoardJSON} from "./Board";
import BoardLane, {BoardLaneJSON} from "./BoardLane";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";
import ValidatorType from "../../../common/enums/ValidatorType";
import _ from "lodash";

@TypeORM.Entity()
export default class BoardCategory extends Entity<BoardCategory>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 64})
  public name: string;

  @TypeORM.Column({type: "int"})
  public weight: number;

  @TypeORM.ManyToOne(() => Board, entity => entity.board_category_list, {nullable: false, onDelete: "CASCADE", onUpdate: "CASCADE"})
  @TypeORM.JoinColumn({name: "board_id"})
  public board: Board;

  @TypeORM.Column({type: "varchar", length: 36})
  public board_id: string;

  @TypeORM.OneToMany(() => BoardLane, entity => entity.board_category)
  @TypeORM.JoinColumn({name: "user_id"})
  public board_lane_list: BoardLane[];

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, select: false, default: null})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  public toJSON(): BoardCategoryJSON {
    return {
      id:              this.id,
      name:            this.name,
      weight:          this.weight,
      board:           this.board.toJSON(),
      board_lane_list: _.map(this.board_lane_list, entity => entity.toJSON()),
      time_created:    this.time_created,
    };
  }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "board");
    this.join(query, "board_lane_list");
    this.join(query, "board_lane_list", "board_card_list");
    return query;
  }

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @BoardCategory.get("/by-board/:id")
  @BoardCategory.bindPagination(100, ["id", "name", "time_created"])
  public static async findManyByBoardID({params: {id}, locals: {respond, user, parameters}}: Server.Request<{id: string}, Response.getFindManyByBoardID, Request.getFindManyByBoardID>) {
    const {skip, limit, order} = parameters!;

    try {
      const board = await Board.performSelect(id);
      if (board.user_created.id !== user!.id) return respond?.(new ServerException(403, {id}));

      const query = this.createPaginated({skip, limit, order});
      this.addValueClause(query, "board_id", board.id);
      return respond?.(await query.getMany());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @BoardCategory.post("/")
  @BoardCategory.bindParameter<Request.postCreateOne>("name", ValidatorType.STRING, {min_length: 1})
  @BoardCategory.bindParameter<Request.postCreateOne>("weight", ValidatorType.INTEGER, {min: 0}, {flag_optional: true})
  @BoardCategory.bindParameter<Request.postCreateOne>("board", ValidatorType.UUID)
  private static async createOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {name, weight, board} = parameters!;
    const entity = TypeORM.getRepository(BoardCategory).create();

    try {
      entity.board = await Board.performSelect(board);
      if (entity.board.user_created_id !== user?.id) return respond?.(new ServerException(403));

      entity.name = name;
      entity.weight = weight ?? entity.board.board_category_list.length;

      return respond?.(await this.performInsert(entity));
    }
    catch (error) {
      if (error.code === "ER_DUP_ENTRY") return respond?.(new ServerException(409, {name}));
      return respond?.(error);
    }
  }

  //endregion ----- Endpoint methods -----

}

export type BoardCategoryJSON = {
  id: string
  name: string
  weight: number
  board: BoardJSON
  board_lane_list: BoardLaneJSON[]
  time_created: Date
}

namespace Request {
  export type getFindManyByBoardID = Pagination
  export type postCreateOne = {name: string, weight?: number, board: string}
}

namespace Response {
  export type getFindManyByBoardID = BoardCategory[] | ServerException
  export type postCreateOne = BoardCategory | ServerException
}
