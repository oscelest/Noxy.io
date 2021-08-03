export default class Alias {
  
  public readonly class?: Constructor;
  public readonly method?: string;
  
  constructor(constructor?: Constructor, method?: string) {
    this.class = constructor;
    this.method = method;
  }
  
  public toString() {
    return `${this.class?.name ?? "Default"}.${this.method ?? "default"}`;
  }
  
}

type Constructor = {new(...args: any[]): any, name?: string}
