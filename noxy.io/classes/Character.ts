import Decoration from "./Decoration";

export default class Character {
  
  readonly #value: string;
  readonly #decoration: Decoration;
  
  public static linebreak: string = "\n";
  public static tab: string = "\t";
  
  constructor(value: string, decoration?: Initializer<Decoration>) {
    this.#value = value[0];
    this.#decoration = new Decoration(decoration);
  }
  
  
  public get value() {
    return this.#value;
  }
  
  public get decoration() {
    return new Decoration(this.#decoration);
  }
  
  public decorate(decoration: Initializer<Decoration>) {
    return new Character(this.value, Object.assign(this.decoration, decoration));
  }
  
  public static parseHTML(node: Node, decoration: Decoration = new Decoration()) {
    const text = [] as Character[];
    if (node instanceof HTMLBRElement) {
      text.push(new Character(Character.linebreak, decoration));
    }
    else if (node instanceof Text) {
      for (let j = 0; j < node.data.length; j++) {
        const item = node.data.at(j);
        if (!item) continue;
        text.push(new Character(item, decoration));
      }
    }
    else if (node instanceof HTMLElement) {
      decoration = Decoration.parseHTML(node, decoration);
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes.item(i);
        if (!child) continue;
        text.push(...this.parseHTML(child, decoration));
      }
    }
    
    return text;
  }
}
