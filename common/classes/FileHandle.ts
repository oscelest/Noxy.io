import FileTypeName from "../enums/FileTypeName";
import _ from "lodash";

export default class FileHandle {

  public id: string;
  public field: string;
  public name: string;
  public encoding: string;
  public mime_type: string;
  public file_type: FileTypeName;
  public extension: string;
  public destination: string;
  public path: string;
  public size: number;

  constructor(file: File) {
    const file_type_name = file.mimetype.split("/")[0];

    this.id = file.filename;
    this.name = file.originalname;
    this.mime_type = file.mimetype;
    this.file_type = _.find(FileTypeName, name => name === file_type_name) ?? FileTypeName.UNKNOWN;
    this.extension = _.last(file.originalname.split(".")) ?? "";
    this.field = file.fieldname;
    this.encoding = file.encoding;
    this.destination = file.destination;
    this.path = file.path;
    this.size = file.size;
  }

  public toJSON() {
    return {
      name:      this.name,
      mime_type: this.mime_type,
      size:      this.size,
    };
  }


}
