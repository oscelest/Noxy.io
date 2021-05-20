import * as TypeORM from "typeorm";
import Entity, {Pagination} from "../../../common/classes/Entity";
import BoardCategory, {BoardCategoryJSON} from "./BoardCategory";
import ValidatorType from "../../../common/enums/ValidatorType";
import Server from "../../../common/services/Server";
import ServerException from "../../../common/exceptions/ServerException";
import User from "../User";

@TypeORM.Entity()
export default class Board extends Entity<Board>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 64})
  public name: string;

  @TypeORM.OneToMany(() => BoardCategory, entity => entity.board)
  @TypeORM.JoinColumn({name: "user_id"})
  public board_category_list: BoardCategory[];

  @TypeORM.ManyToOne(() => User, user => user.board_created_list, {nullable: false})
  @TypeORM.JoinColumn({name: "user_created_id"})
  public user_created: User;

  @TypeORM.Column({type: "varchar", length: 36})
  public user_created_id: string;

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, default: null})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  public toJSON(): BoardJSON {
    return {
      id:                  this.id,
      name:                this.name,
      board_category_list: this.board_category_list,
      time_created:        this.time_created,
      time_updated:        this.time_updated,
    };
  }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "user_created");
    this.join(query, "board_category_list");
    return query;
  }

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @Board.get("/")
  @Board.bindPagination(100, ["id", "name", "time_created"])
  public static async findMany({locals: {respond, user, parameters}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const {skip, limit, order, name} = parameters!;
    const query = this.createPaginated({skip, limit, order});

    this.addWildcardClause(query, "name", name);
    this.addValueClause(query, "user_created", user?.id);

    try {
      return respond?.(await query.getMany());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @Board.get("/count")
  public static async count({locals: {respond, user, parameters}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    const {name} = parameters!;
    const query = this.createSelect();

    this.addWildcardClause(query, "name", name);
    this.addValueClause(query, "user_created", user?.id);

    try {
      return respond?.(await query.getCount());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @Board.get("/:id")
  public static async findOneByID({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.getFindOnyByID, Request.getFindOnyByID>) {
    try {
      const entity = await this.performSelect(id);
      if (entity.user_created.id !== user!.id) return respond?.(new ServerException(403, {id}));
      return respond?.(entity);
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @Board.post("/")
  @Board.bindParameter<Request.postCreateOne>("name", ValidatorType.STRING, {min_length: 1})
  private static async createOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {name} = parameters!;
    const entity = TypeORM.getRepository(Board).create();

    entity.name = name;
    entity.user_created = user!;

    try {
      return respond?.(await this.performInsert(entity));
    }
    catch (error) {
      if (error.code === "ER_DUP_ENTRY") return respond?.(new ServerException(409, {name}));
      return respond?.(error);
    }
  }

  //endregion ----- Endpoint methods -----

}

export type BoardJSON = {
  id: string
  name: string
  board_category_list: BoardCategoryJSON[]
  time_created: Date
  time_updated: Date
}

namespace Request {
  export type getCount = {name?: string}
  export type getFindMany = getCount & Pagination
  export type getFindOnyByID = never
  export type postCreateOne = {name: string}
}

namespace Response {
  export type getCount = number | ServerException
  export type getFindMany = Board[] | ServerException
  export type getFindOnyByID = Board | ServerException
  export type postCreateOne = Board | ServerException
}

