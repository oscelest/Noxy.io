import * as TypeORM from "typeorm";
import Entity from "../../../common/classes/Entity";
import File from "./File";
import FileType, {FileTypeJSON} from "./FileType";

@TypeORM.Entity()
@TypeORM.Unique("name", ["name"])
@TypeORM.Unique("mime_type", ["mime_type"])
@TypeORM.Index("time_created", ["time_created"])
@TypeORM.Index("time_updated", ["time_updated"])
export default class FileExtension extends Entity<FileExtension>(TypeORM) {

  //region    ----- Properties -----

  @TypeORM.PrimaryGeneratedColumn("uuid")
  public id: string;

  @TypeORM.Column({type: "varchar", length: 16})
  public name: string;

  @TypeORM.Column({type: "varchar", length: 128})
  public mime_type: string;

  @TypeORM.ManyToOne(() => FileType, entity => entity.file_extensions, {nullable: false, onDelete: "RESTRICT", onUpdate: "CASCADE"})
  @TypeORM.JoinColumn({name: "file_type_id"})
  public file_type: FileType;

  @TypeORM.Column({type: "varchar", length: 36})
  public file_type_id: string;

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
      mime_type:    this.mime_type,
      file_type:    this.file_type?.toJSON() ?? this.file_type_id,
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
  file_type: FileTypeJSON
  mime_type: string
  time_created: Date
  time_updated: Date
}
