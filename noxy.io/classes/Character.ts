import Decoration from "./Decoration";

export default class Character {

  public readonly value: string;
  public readonly decoration: Decoration;

  constructor(value: string, decoration?: Initializer<Decoration>) {
    this.value = value[0];
    this.decoration = new Decoration(decoration);
  }
  
  public decorate(decoration: Initializer<Decoration>) {
    return new Character(this.value, Object.assign(this.decoration, decoration));
  }
  
  public static parseHTML(html: Node, decoration: Decoration = new Decoration()) {
    const text = [] as Character[];
    for (let i = 0; i < html.childNodes.length; i++) {
      const child = html.childNodes[i];
      if (child instanceof HTMLBRElement) {
        text.push(new Character("\n", decoration));
      }
      else if (child instanceof Text) {
        const content = child.textContent ?? "";
        for (let j = 0; j < content.length; j++) {
          text.push(new Character(content[j], decoration));
        }
      }
      else {
        text.push(...this.parseHTML(child, Decoration.parseHTML(child, decoration)));
      }
    }
    return text;
  }
}
