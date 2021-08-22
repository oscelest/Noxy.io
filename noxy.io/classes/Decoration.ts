export class Decoration {

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

    // this.bold = !!((initializer?.bold || 0) & DecorationValue.BOLD);
    // this.code = !!(decoration & DecorationValue.CODE);
    // this.mark = !!(decoration & DecorationValue.MARK);
    // this.italic = !!(decoration & DecorationValue.ITALIC);
    // this.underline = !!(decoration & DecorationValue.UNDERLINE);
    // this.strikethrough = !!(decoration & DecorationValue.STRIKETHROUGH);
    // this.font_size = font_size ?? 0;
    // this.font_family = font_style ?? "";
    // this.color = color ?? "";
    // this.background_color = background_color ?? "";
  }

  public equals(decoration: Decoration) {
    return Object.keys(this).every(key => this[key as keyof Decoration] === decoration[key as keyof Decoration]);
  }

  public toJSON() {
    // const json = [0, this.font_size];
    // if (this.bold) json[0] += DecorationValue.BOLD;
    // if (this.code) json[0] += DecorationValue.CODE;
    // if (this.mark) json[0] += DecorationValue.MARK;
    // if (this.italic) json[0] += DecorationValue.ITALIC;
    // if (this.underline) json[0] += DecorationValue.UNDERLINE;
    // if (this.strikethrough) json[0] += DecorationValue.STRIKETHROUGH;
    // return JSON.stringify(json);
  }

}


export type StyleInitializer = [number?, number?, string?, string?, string?]
