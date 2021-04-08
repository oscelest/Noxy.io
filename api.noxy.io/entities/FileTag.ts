import Express from "express";
import * as TypeORM from "typeorm";
import Entity, {Pagination} from "../classes/Entity";
import EndpointParameterType from "../../common/enums/EndpointParameterType";
import ServerException from "../exceptions/ServerException";
import File from "./File";
import User, {UserJSON} from "./User";

@TypeORM.Entity()
@TypeORM.Unique("file_tag", ["name", "user_created"] as (keyof FileTag)[])
@TypeORM.Index("time_created", ["time_created"] as (keyof FileTag)[])
@TypeORM.Index("time_updated", ["time_updated"] as (keyof FileTag)[])
export default class FileTag extends Entity<FileTag>() {

  /**
   * Properties
   */

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 64})
  public name: string;

  public size: number;

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
      size:         this.size,
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
    this.countRelation(query, "size", "file_list");
    this.join(query, "user_created");
    return query;
  }

  @FileTag.get("/")
  @FileTag.bindParameter<Request.getFindMany>("name", EndpointParameterType.STRING, {max_length: 64})
  @FileTag.bindParameter<Request.getFindMany>("exclude", EndpointParameterType.UUID, {flag_array: true})
  @FileTag.bindPagination(100, ["id", "name", "time_created"])
  public static async findMany({locals: {respond, parameters}}: Express.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const {skip, limit, order, name, user_created, exclude} = parameters!;
    const query = this.createPaginated({skip, limit, order});

    this.addExclusionClause(query, "id", exclude);
    this.addWildcardClause(query, "name", name);
    this.addValueClause(query, "user_created", user_created);

    try {
      return respond?.(await query.getMany());
    }
    catch (error) {
      return respond?.(error);
    }
  }


  @FileTag.get("/count")
  @FileTag.bindParameter<Request.getCount>("name", EndpointParameterType.STRING, {max_length: 64})
  @FileTag.bindParameter<Request.getCount>("exclude", EndpointParameterType.UUID, {flag_array: true})
  @FileTag.bindPagination(100, ["id", "name", "time_created"])
  public static async count({locals: {respond, parameters}}: Express.Request<{}, Response.getCount, Request.getCount>) {
    const {name, user_created, exclude} = parameters!;
    const query = this.createSelect();

    this.addExclusionClause(query, "id", exclude);
    this.addWildcardClause(query, "name", name);
    this.addValueClause(query, "user_created", user_created);

    try {
      return respond?.(await query.getCount());
    }
    catch (error) {
      return respond?.(error);
    }
  }

  @FileTag.post("/")
  @FileTag.bindParameter<Request.postCreateOne>("name", EndpointParameterType.STRING, {min_length: 3, max_length: 64})
  private static async createOne({locals: {respond, user, parameters}}: Express.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    const {name} = parameters!;
    const entity = TypeORM.getRepository(FileTag).create();

    entity.name = name;
    entity.user_created = user!;

    try {
      return respond?.(await this.performInsert(entity));
    }
    catch (error) {
      return respond?.(error);
    }
  }

  /**
   * Endpoint methods
   */

}

export type FileTagJSON = {
  id: string
  name: string
  size: number
  user_created: UserJSON
  time_created: Date
  time_updated: Date
}

namespace Request {
  export type getFindMany = getCount & Pagination
  export type getCount = {name?: string, user_created?: string, exclude?: string[]}
  export type postCreateOne = {name: string, user_created: string}
}

namespace Response {
  export type getFindMany = FileTag[] | ServerException
  export type getCount = number
  export type postCreateOne = FileTag | ServerException
}
