import Entity from "../../../common/classes/Entity";
import FileTypeName from "../../../common/enums/FileTypeName";
import {Entity as DBEntity, Enum, Unique, Index, Property, PrimaryKey} from "@mikro-orm/core";
import {v4} from "uuid";

@DBEntity()
@Unique({name: "name", properties: ["name"] as (keyof FileExtension)[]})
@Unique({name: "mime_type", properties: ["mime_type", "name"] as (keyof FileExtension)[]})
@Index({name: "time_created", properties: ["time_created"] as (keyof FileExtension)[]})
@Index({name: "time_updated", properties: ["time_updated"] as (keyof FileExtension)[]})
export default class FileExtension extends Entity<FileExtension>() {

  //region    ----- Properties -----

  @PrimaryKey({length: 36})
  public id: string = v4();

  @Property({length: 16})
  public name: string;

  @Enum(() => FileTypeName)
  public type: FileTypeName;

  @Property({length: 128})
  public mime_type: string;

  @Property()
  public time_created: Date = new Date();

  @Property({onUpdate: () => new Date()})
  public time_updated: Date;

  //endregion ----- Properties -----

  //region    ----- Instance methods -----

  // public toJSON(strict: boolean = true, strip: (keyof FileExtension)[] = []): FileExtensionJSON {
  //   return {
  //     id:           this.id,
  //     name:         this.name,
  //     type:         this.type,
  //     mime_type:    this.mime_type,
  //     time_created: this.time_created,
  //     time_updated: this.time_updated,
  //   };
  // }

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

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
