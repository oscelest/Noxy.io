export default abstract class Exception extends Error {
  
  public message: string;

  protected constructor(name: string, message?: string) {
    super(message);
    this.name = name;
  }

}
