import * as TypeORM from "typeorm";
import Entity from "../../../common/classes/Entity";
import File from "./File";
import FileTypeName from "../../../common/enums/FileTypeName";

@TypeORM.Entity()
@TypeORM.Unique("name", ["name"])
@TypeORM.Unique("mime_type", ["mime_type", "name"])
@TypeORM.Index("time_created", ["time_created"])
@TypeORM.Index("time_updated", ["time_updated"])
export default class FileExtension extends Entity<FileExtension>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 16})
  public name: string;

  @TypeORM.Column({type: "enum", enum: FileTypeName, nullable: false})
  public type: FileTypeName;

  @TypeORM.Column({type: "varchar", length: 128})
  public mime_type: string;

  @TypeORM.CreateDateColumn()
  public time_created: Date;

  @TypeORM.UpdateDateColumn({nullable: true, select: false, default: null})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Relations -----

  @TypeORM.OneToMany(() => File, entity => entity.file_extension)
  public file_list: File[];

  //endregion ----- Relations -----

  //region    ----- Instance methods -----

  public toJSON(): FileExtensionJSON {
    return {
      id:           this.id,
      name:         this.name,
      type:         this.type,
      mime_type:    this.mime_type,
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

  //endregion ----- Endpoint methods -----
}

export type FileExtensionJSON = {
  id: string
  name: string,
  type: FileTypeName
  mime_type: string
  time_created: Date
  time_updated: Date
}
