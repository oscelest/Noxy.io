import Exception from "../../common/classes/Exception";
import HTTPStatusCodes from "../../common/enums/HTTPStatusCode";

export default class HistoryException extends Exception {
  
  public code: keyof typeof HTTPStatusCodes;
  public content: any;
  
  constructor(message: string) {
    super("HistoryException", message);
  }
  
}
