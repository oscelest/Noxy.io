import Express from "express";
import * as TypeORM from "typeorm";
import Entity, {Pagination} from "../classes/Entity";
import EndpointParameterType from "../enums/server/EndpointParameterType";
import ServerException from "../exceptions/ServerException";
import FileExtension from "./FileExtension";
import FileTag from "./FileTag";

@TypeORM.Entity()
@TypeORM.Unique("name", ["name"])
@TypeORM.Index("time_created", ["time_created"])
@TypeORM.Index("time_updated", ["time_updated"])
export default class FileType extends Entity<FileType>() {

  /**
   * Properties
   */

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 16})
  public name: string;

  @TypeORM.OneToMany(() => FileExtension, file => file.file_type)
  public file_extensions: FileExtension[];

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, select: false, default: null})
  public time_updated: Date;

  /**
   * Instance methods
   */

  public toJSON(): FileTypeJSON {
    return {
      id:           this.id,
      name:         this.name,
      time_created: this.time_created,
      time_updated: this.time_updated,
    };
  }

  /**
   * Utility methods
   */

  public static createSelect() {
    return TypeORM.createQueryBuilder(this);
  }

  /**
   * Endpoint methods
   */


  @FileType.get("/")
  @FileType.bindParameter<Request.getFindMany>("name", EndpointParameterType.STRING, {max_length: 16})
  @FileType.bindParameter<Request.getFindMany>("exclude", EndpointParameterType.UUID, {flag_array: true})
  @FileType.bindPagination(100, ["id", "name", "time_created"])
  private static async findMany({locals: {respond, parameters}}: Express.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const {skip, limit, order, name, exclude} = parameters!;
    const query = this.createPaginated({skip, limit, order});

    this.addWildcardClause(query, "name", name);
    this.addExclusionClause(query, "id", exclude);

    return respond?.(await query.getMany());
  }


  @FileType.get("/count")
  @FileType.bindParameter<Request.getCount>("name", EndpointParameterType.STRING, {max_length: 16})
  @FileType.bindParameter<Request.getCount>("exclude", EndpointParameterType.UUID, {flag_array: true})
  private static async count({locals: {respond, parameters}}: Express.Request<{}, Response.getCount, Request.getCount>) {
    const {name, exclude} = parameters!;
    const query = this.createSelect();

    this.addWildcardClause(query, "name", name);
    this.addExclusionClause(query, "id", exclude);

    return respond?.(await query.getCount());
  }

  @FileType.post("/")
  @FileType.bindParameter<Request.postCreateOne>("name", EndpointParameterType.STRING, {min_length: 3, max_length: 128})
  private static async createOne({locals: {respond, parameters}}: Express.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    return respond?.(await this.performInsert(parameters!));
  }
}

export type FileTypeJSON = {
  id: string
  name: string,
  time_created: Date
  time_updated: Date
}

namespace Request {
  export type getFindMany = getCount  & Pagination
  export type getCount = {name?: string; exclude?: string[]}
  export type postCreateOne = {name: string}
}

namespace Response {
  export type getFindMany = FileType[] | ServerException
  export type getCount = number
  export type postCreateOne = FileType | ServerException
}
