import Helper from "../Helper";

export default class Decoration {
  
  public static defaultFontFamily = Helper.FontFamilyList[7];
  public static defaultFontSize = Helper.FontSizeList[5];
  public static defaultFontLength = Helper.FontLengthList[0];
  
  public readonly bold: boolean;
  public readonly code: boolean;
  public readonly mark: boolean;
  public readonly italic: boolean;
  public readonly underline: boolean;
  public readonly strikethrough: boolean;
  
  public readonly font_size: string;
  public readonly font_size_length: string;
  public readonly font_family: string;
  public readonly color: string;
  public readonly background_color: string;
  
  public readonly selected: boolean;
  
  constructor(initializer: Initializer<Decoration> = {}) {
    this.bold = initializer.bold ?? false;
    this.code = initializer.code ?? false;
    this.mark = initializer.mark ?? false;
    this.italic = initializer.italic ?? false;
    this.underline = initializer.underline ?? false;
    this.strikethrough = initializer.strikethrough ?? false;
    this.font_family = initializer.font_family ?? Decoration.defaultFontFamily;
    this.font_size = initializer.font_size ?? Decoration.defaultFontSize;
    this.font_size_length = initializer.font_size_length ?? Decoration.defaultFontLength;
    this.color = initializer.color ?? "";
    this.background_color = initializer.background_color ?? "";
    this.selected = initializer.selected ?? false;
  }
  
  public equals(decoration: Decoration) {
    return Object.keys(this).every(key => this[key as keyof Decoration] === decoration[key as keyof Decoration]);
  }
  
  public static parseHTML(node: Node, decoration?: Initializer<Decoration>) {
    const initializer = {...decoration} as Properties<{ -readonly [P in keyof Decoration]: Decoration[P] }>;
    
    if (node instanceof HTMLElement) {
      if (node.tagName === "B") initializer.bold = true;
      if (node.tagName === "I") initializer.italic = true;
      if (node.tagName === "U") initializer.underline = true;
      if (node.tagName === "S") initializer.strikethrough = true;
      if (node.tagName === "CODE") initializer.code = true;
      if (node.tagName === "MARK") initializer.mark = true;
      
      const {fontSize, fontFamily, color, backgroundColor} = node.style;
      const [font_size, font_size_length] = fontSize.split(/(?<=[0-9]+)(?=[a-z]+)/);
      initializer.font_size = font_size && !isNaN(+font_size) ? font_size : Decoration.defaultFontSize;
      initializer.font_size_length = Helper.isValidLengthType(font_size_length) ? font_size_length : Decoration.defaultFontLength;
      initializer.font_family = fontFamily || Decoration.defaultFontFamily;
      initializer.color = color;
      initializer.background_color = backgroundColor;
    }
    
    return new Decoration(initializer);
  }
  
}
