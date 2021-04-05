export default class FormException extends Error {
  
  public message: string;
  public content: Record<string, Error | undefined>;
  
  constructor(message: string, content: Record<string, Error | undefined>) {
    super(message);
    this.content = content;
  }
  
}
