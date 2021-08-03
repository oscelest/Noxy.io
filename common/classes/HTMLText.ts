export default class HTMLText {

  private text: Character[]

  constructor() {
    this.text = [];
  }

  public insert(text: string, position: number = this.text.length) {
    const t = document.createElement("div");
    t.innerHTML = text;
    console.log(t);

    for (let i = 0; i < text.length; i++) {
      this.text.splice(position + i, 0, {value: text[i], bold: false, italic: false})
    }
  }

  public toHTML() {
    return this.text.map(char => char.value).join("")
  }

}

interface Character {
  value: string
  bold: boolean
  italic: boolean
}

