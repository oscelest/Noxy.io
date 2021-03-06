import Exception from "../../common/classes/Exception";
import HTTPStatusCodes from "../../common/enums/HTTPStatusCode";

export default class ServerException extends Exception {
  
  public code: keyof typeof HTTPStatusCodes;
  public content: any;
  
  constructor(code: keyof typeof HTTPStatusCodes, content: any = {}, message: string = HTTPStatusCodes[code]) {
    super("ServerException", message);
    this.code = code;
    this.content = content;
  }
  
}
