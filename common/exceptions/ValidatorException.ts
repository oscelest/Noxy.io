import Exception from "../classes/Exception";

export default class ValidatorException extends Exception {

  public received?: string;
  public parsed?: string;
  
  constructor(message: string, received?: any, parsed?: any) {
    super("ValidatorException", message);
    this.received = received;
    this.parsed = parsed;
  }
  
  public toJSON() {
    return {
      message:  this.message,
      received: this.received,
      parsed:   this.parsed,
    };
  }
  
}
