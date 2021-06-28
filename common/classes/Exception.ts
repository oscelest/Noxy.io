export default abstract class Exception extends Error {
  
  protected constructor(name: string, message?: string) {
    super(message);
    this.name = name;
  }

}
