import * as TypeORM from "typeorm";
import Entity from "../../../common/classes/Entity";
import BoardCard, {BoardCardJSON} from "./BoardCard";
import BoardCategory, {BoardCategoryJSON} from "./BoardCategory";
import ValidatorType from "../../../common/enums/ValidatorType";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";

@TypeORM.Entity()
export default class BoardLane extends Entity<BoardLane>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "json"})
  public content: string;

  @TypeORM.ManyToOne(() => BoardCategory, entity => entity.board_lane_list, {nullable: false, onDelete: "RESTRICT", onUpdate: "CASCADE"})
  @TypeORM.JoinColumn({name: "board_category_id"})
  public board_category: BoardCategory;
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
      board_category:  this.board_category,
      board_card_list: this.board_card_list,
      time_created:    this.time_created,
    };
  }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "board_category");
    this.join(query, "board_card_list");
    return query;
  }

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @BoardLane.post("/")
  @BoardLane.bindParameter<Request.postCreateOne>("content", ValidatorType.STRING, {min_length: 1})
  @BoardLane.bindParameter<Request.postCreateOne>("board_category", ValidatorType.UUID)
  private static async createOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {board_category, content} = parameters!;
    const entity = TypeORM.getRepository(BoardLane).create();

    entity.content = content;

    try {
      entity.board_category = await BoardCategory.performSelect(board_category);
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

export type BoardLaneJSON = {
  id: string
  content: string
  board_category: BoardCategoryJSON
  board_card_list: BoardCardJSON[]
  time_created: Date
}


namespace Request {
  export type postCreateOne = {content: string, board_category: string}
}

namespace Response {
  export type postCreateOne = BoardLane | ServerException
}
