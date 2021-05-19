import * as TypeORM from "typeorm";
import Entity, {Pagination} from "../../../common/classes/Entity";
import FileTypeName from "../../../common/enums/FileTypeName";
import ValidatorType from "../../../common/enums/ValidatorType";
import ServerException from "../../../common/exceptions/ServerException";
import Server from "../../../common/services/Server";
import FileExtension from "./FileExtension";

@TypeORM.Entity()
@TypeORM.Unique("name", ["name"])
@TypeORM.Index("time_created", ["time_created"])
@TypeORM.Index("time_updated", ["time_updated"])
export default class FileType extends Entity<FileType>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "enum", enum: FileTypeName, nullable: false})
  public name: FileTypeName;

  @TypeORM.OneToMany(() => FileExtension, entity => entity.file_type)
  public file_extensions: FileExtension[];

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, select: false, default: null})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  public toJSON(): FileTypeJSON {
    return {
      id:           this.id,
      name:         this.name,
      time_created: this.time_created,
      time_updated: this.time_updated,
    };
  }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  public static createSelect() {
    return TypeORM.createQueryBuilder(this);
  }

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  @FileType.get("/")
  @FileType.bindParameter<Request.getFindMany>("name", ValidatorType.ENUM, FileTypeName)
  @FileType.bindParameter<Request.getFindMany>("exclude", ValidatorType.UUID, {flag_array: true})
  @FileType.bindPagination(100, ["id", "name", "time_created"])
  private static async findMany({locals: {respond, parameters}}: Server.Request<{}, Response.getFindMany, Request.getFindMany>) {
    const {skip, limit, order, name, exclude} = parameters!;
    const query = this.createPaginated({skip, limit, order});

    this.addWildcardClause(query, "name", name);
    this.addExclusionClause(query, "id", exclude);

    return respond?.(await query.getMany());
  }


  @FileType.get("/count")
  @FileType.bindParameter<Request.getCount>("name", ValidatorType.ENUM, FileTypeName)
  @FileType.bindParameter<Request.getCount>("exclude", ValidatorType.UUID, {flag_array: true})
  private static async count({locals: {respond, parameters}}: Server.Request<{}, Response.getCount, Request.getCount>) {
    const {name, exclude} = parameters!;
    const query = this.createSelect();

    this.addWildcardClause(query, "name", name);
    this.addExclusionClause(query, "id", exclude);

    return respond?.(await query.getCount());
  }


  @FileType.get("/by-unique")
  @FileType.bindParameter<Request.getFindManyByUnique>("name", ValidatorType.ENUM, FileTypeName, {flag_array: true})
  private static async findManyByUnique({locals: {respond, parameters}}: Server.Request<{}, Response.getFindManyByUnique, Request.getFindManyByUnique>) {
    const {name} = parameters!;
    const query = this.createSelect();

    this.addValueClause(query, "name", name);

    return respond?.(await query.getMany());
  }


  @FileType.post("/")
  @FileType.bindParameter<Request.postCreateOne>("name", ValidatorType.ENUM, FileTypeName)
  private static async createOne({locals: {respond, parameters}}: Server.Request<{}, Response.postCreateOne, Request.postCreateOne>) {
    return respond?.(await this.performInsert(parameters!));
  }

  //endregion ----- Endpoint methods -----

}

export type FileTypeJSON = {
  id: string
  name: string,
  time_created: Date
  time_updated: Date
}

namespace Request {
  export type getCount = {name?: string; exclude?: string[]}
  export type getFindMany = getCount & Pagination
  export type getFindManyByUnique = {name?: string[]}
  export type postCreateOne = {name: FileTypeName}
}

namespace Response {
  export type getCount = number
  export type getFindMany = FileType[] | ServerException
  export type getFindManyByUnique = FileType[] | ServerException
  export type postCreateOne = FileType | ServerException
}
