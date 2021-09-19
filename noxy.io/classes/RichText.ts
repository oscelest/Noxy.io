import Character from "./Character";

export default class RichText {
  
  readonly #value: Character[];
  
  constructor(...initializer: (string | Character | Character[] | RichText)[]) {
    this.#value = [];
    
    for (let i = 0; i < initializer.length; i++) {
      const text = initializer[i];
      if (typeof text === "string") {
        for (let j = 0; j < text.length; j++) {
          this.#value.push(new Character(text[j]));
        }
      }
      else if (text instanceof Character) {
        this.#value.push(text);
      }
      else if (text instanceof RichText) {
        this.#value.push(...text.#value);
      }
      else if (Array.isArray(text)) {
        this.#value.push(...text);
      }
    }
  }
  
  public get length() {
    return this.#value.length;
  }
  
  public at(position: number, safe: true): Character
  public at(position: number, safe?: false): Character | undefined
  public at(position: number, safe: boolean = false): Character | undefined {
    const character = this.#value[position];
    if (!character && safe) throw new Error(`Could not get character at position [${position}]`);
    return character;
  }
  
  public slice(start?: number, end?: number) {
    return this.#value.slice(start, end);
  }
  
}
