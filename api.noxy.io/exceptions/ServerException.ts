import HTTPStatusCodes from "../enums/server/HTTPStatusCode";
import Exception from "../classes/Exception";

export default class ServerException extends Exception {
  
  public code: keyof typeof HTTPStatusCodes;
  public message: string;
  public content: any;
  
  constructor(code: keyof typeof HTTPStatusCodes, content: any = {}, message: string = HTTPStatusCodes[code]) {
    super("ServerException", message);
    this.code = code;
    this.content = content;
  }
  
}
