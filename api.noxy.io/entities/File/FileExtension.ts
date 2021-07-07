import Entity from "../../../common/classes/Entity";
import FileTypeName from "../../../common/enums/FileTypeName";
import {Entity as DBEntity, Enum, Unique, Index, Property, PrimaryKey} from "@mikro-orm/core";
import {v4} from "uuid";

@DBEntity()
@Unique({name: "extension", properties: ["name", "mime_type"] as (keyof FileExtension)[]})
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

  //endregion ----- Instance methods -----

  //region    ----- Utility methods -----

  //endregion ----- Utility methods -----

  //region    ----- Endpoint methods -----

  //endregion ----- Endpoint methods -----
}
