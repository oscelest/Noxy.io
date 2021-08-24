export default class Decoration {

  public bold: boolean;
  public code: boolean;
  public mark: boolean;
  public italic: boolean;
  public underline: boolean;
  public strikethrough: boolean;

  public font_size: string;
  public font_family: string;
  public color: string;
  public background_color: string;

  constructor(initializer: Initializer<Decoration> = {}) {
    this.bold = initializer.bold ?? false;
    this.code = initializer.code ?? false;
    this.mark = initializer.mark ?? false;
    this.italic = initializer.italic ?? false;
    this.underline = initializer.underline ?? false;
    this.strikethrough = initializer.strikethrough ?? false;
    this.font_size = initializer.font_size ?? "";
    this.font_family = initializer.font_family ?? "";
    this.color = initializer.color ?? "";
    this.background_color = initializer.background_color ?? "";
  }

  public equals(decoration: Decoration) {
    return Object.keys(this).every(key => this[key as keyof Decoration] === decoration[key as keyof Decoration]);
  }

  public static parseHTML(node: Node, decoration: Decoration = new Decoration()) {
    if (node instanceof HTMLElement) {
      if (node.tagName === "B") decoration.bold = true;
      if (node.tagName === "I") decoration.italic = true;
      if (node.tagName === "U") decoration.underline = true;
      if (node.tagName === "S") decoration.strikethrough = true;
      if (node.tagName === "CODE") decoration.code = true;
      if (node.tagName === "MARK") decoration.mark = true;

      const {fontSize, fontFamily, color, backgroundColor} = node.style;
      decoration.font_size = fontSize;
      decoration.font_family = fontFamily;
      decoration.color = color;
      decoration.background_color = backgroundColor;
    }
    return decoration;
  }

}


export type StyleInitializer = [number?, number?, string?, string?, string?]
