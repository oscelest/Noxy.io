import * as TypeORM from "typeorm";
import Entity, {Pagination} from "../../common/classes/Entity";
import ValidatorType from "../../common/enums/ValidatorType";
import ServerException from "../../common/exceptions/ServerException";
import Server from "../../common/services/Server";
import File from "./File";
import User, {UserJSON} from "./User";

@TypeORM.Entity()
@TypeORM.Unique("file_tag", ["name", "user_created"] as (keyof FileTag)[])
@TypeORM.Index("time_created", ["time_created"] as (keyof FileTag)[])
@TypeORM.Index("time_updated", ["time_updated"] as (keyof FileTag)[])
export default class FileTag extends Entity<FileTag>(TypeORM) {

  /**
   * Properties
   */

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 64})
  public name: string;

  @TypeORM.ManyToOne(() => User, user => user.file_tag_created_list, {nullable: false})
  @TypeORM.JoinColumn({name: "user_created_id"})
  public user_created: User;
  public user_created_id: string;

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, select: false, default: null})
  public time_updated: Date;

  /**
   * Relations
   */

  @TypeORM.ManyToMany(() => File, file => file.file_tag_list)
  public file_list: File[];

  /**
   * Instance methods
   */

  public toJSON(): FileTagJSON {
    return {
      id:           this.id,
      name:         this.name,
      user_created: this.user_created.toJSON(),
      time_created: this.time_created,
      time_updated: this.time_updated,
    };
  }

  /**
   * Utility methods
   */

  public static createSelect() {
    const query = TypeORM.createQueryBuilder(this);
    this.join(query, "user_created");
    return query;
  }

  /**
   * Endpoint methods
   */

  @FileTag.get("/count")
  @FileTag.bindParameter<Request.getCount>("name", ValidatorType.STRING, {max_length: 64})
  @FileTag.bindParameter<Request.getCount>("exclude", ValidatorType.UUID, {flag_array: true})
  @FileTag.bindPagination(100, ["id", "name", "time_created"])
  public static async count({locals: {respond, parameters, user}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    const {name, exclude} = parameters!;
    const query = this.createSelect();

    this.addExclusionClause(query, "id", exclude);
    this.addWildcardClause(query, "name", name);
    this.addValueClause(query, "user_created", user!.id);

    try {
      return respond?.(await query.getCount());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @FileTag.get("/")
  @FileTag.bindParameter<Request.getFindMany>("name", ValidatorType.STRING, {max_length: 64})
  @FileTag.bindParameter<Request.getFindMany>("exclude", ValidatorType.UUID, {flag_array: true})
  @FileTag.bindPagination(100, ["id", "name", "time_created"])
  public static async findMany({locals: {respond, parameters, user}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const {skip, limit, order, name, exclude} = parameters!;
    const query = this.createPaginated({skip, limit, order});

    this.addExclusionClause(query, "id", exclude);
    this.addWildcardClause(query, "name", name);
    this.addValueClause(query, "user_created", user!.id);

    try {
      return respond?.(await query.getMany());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @FileTag.get("/by-unique")
  @FileTag.bindParameter<Request.getFindMany>("name", ValidatorType.STRING, {max_length: 64}, {flag_array: true})
  public static async findManyByUnique({locals: {respond, parameters, user}}: Server.Request<{}, Response.getFindManyByUnique, Request.getFindManyByUnique>) {
    const {name} = parameters!;
    const query = this.createSelect();

    this.addListClause(query, "name", name);
    this.addValueClause(query, "user_created", user!.id);

    try {
      return respond?.(await query.getMany());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @FileTag.get("/:id")
  public static async findOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.getFindOne, Request.getFindOne>) {
    const query = this.createSelect();

    this.addExclusionClause(query, "id", id);
    this.addValueClause(query, "user_created", user!.id);

    try {
      return respond?.(await query.getOneOrFail());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @FileTag.get("/by-name/:name")
  public static async findOneByUnique({params: {name}, locals: {respond, user}}: Server.Request<{name: string}, Response.getFindOneByName, Request.getFindOneByName>) {
    const query = this.createSelect();

    this.addValueClause(query, "name", name);
    this.addValueClause(query, "user_created", user!.id);

    try {
      return respond?.(await query.getOneOrFail());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @FileTag.post("/")
  @FileTag.bindParameter<Request.postCreateOne>("name", ValidatorType.STRING, {min_length: 3, max_length: 64})
  private static async createOne({locals: {respond, user, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {name} = parameters!;
    const entity = TypeORM.getRepository(FileTag).create();

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

  @FileTag.delete("/:id")
  private static async deleteOne({params: {id}, locals: {respond, user}}: Server.Request<{id: string}, Response.postCreateOne, Request.postCreateOne>) {
    const query = this.createSelect();
    this.addValueClause(query, "id", id);

    try {
      const entity = await query.getOneOrFail();
      if (entity.user_created.id !== user?.id) return respond?.(new ServerException(403));

      respond?.(await this.performDelete(entity.id));
    }
    catch (error) {
      if (error instanceof TypeORM.EntityNotFoundError) return respond?.(new ServerException(404));
      respond?.(new ServerException(500, error));
    }
  }
}

export type FileTagJSON = {
  id: string
  name: string
  user_created: UserJSON
  time_created: Date
  time_updated: Date
}

namespace Request {
  export type getCount = {name?: string, exclude?: string[]}
  export type getFindMany = getCount & Pagination
  export type getFindManyByUnique = {name: string[]}
  export type getFindOne = {}
  export type getFindOneByName = {name: string}
  export type postCreateOne = {name: string, user_created: string}
  export type deleteDeleteOne = {}
}

namespace Response {
  export type getCount = number
  export type getFindMany = FileTag[] | ServerException
  export type getFindManyByUnique = FileTag[] | ServerException
  export type getFindOne = FileTag | ServerException
  export type getFindOneByName = FileTag | ServerException
  export type postCreateOne = FileTag | ServerException
  export type deleteDeleteOne = FileTag | ServerException
}
