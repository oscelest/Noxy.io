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
  public readonly font_length: string;
  public readonly font_family: string;
  public readonly color: string;
  public readonly background_color: string;
  
  public readonly link: string;
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
    this.font_length = initializer.font_length ?? Decoration.defaultFontLength;
    
    this.color = initializer.color ?? "";
    this.background_color = initializer.background_color ?? "";
    
    this.link = initializer.link ?? "";
    this.selected = initializer.selected ?? false;
  }
  
  public toObject(): DecorationObject {
    return {
      bold:             this.bold,
      code:             this.code,
      mark:             this.mark,
      italic:           this.italic,
      underline:        this.underline,
      strikethrough:    this.strikethrough,
      
      font_family:      this.font_family,
      font_size:        this.font_size,
      font_length:      this.font_length,
      
      color:            this.color,
      background_color: this.background_color,
      
      link:             this.link,
    };
  }
  
  public equals(decoration: Decoration) {
    return Object.keys(this).every(key => this[key as keyof Decoration] === decoration[key as keyof Decoration]);
  }
  
  public getIntersection<O extends DecorationObject>(...target_list: O[]) {
    const initializer = this.toObject() as DecorationObject;
    
    for (let i = 0; i < target_list.length; i++) {
      const target = target_list[i];
      initializer.bold = Decoration.getBooleanIntersection(initializer.bold, target.bold);
      initializer.code = Decoration.getBooleanIntersection(initializer.code, target.code);
      initializer.mark = Decoration.getBooleanIntersection(initializer.mark, target.mark);
      initializer.italic = Decoration.getBooleanIntersection(initializer.italic, target.italic);
      initializer.underline = Decoration.getBooleanIntersection(initializer.underline, target.underline);
      initializer.strikethrough = Decoration.getBooleanIntersection(initializer.strikethrough, target.strikethrough);
      
      initializer.font_size = Decoration.getStringIntersection(initializer.font_size, target.font_size);
      initializer.font_family = Decoration.getStringIntersection(initializer.font_family, target.font_family);
      initializer.font_length = Decoration.getStringIntersection(initializer.font_length, target.font_length);
      
      initializer.color = Decoration.getStringIntersection(initializer.color, target.color);
      initializer.background_color = Decoration.getStringIntersection(initializer.background_color, target.background_color);
      
      initializer.link = Decoration.getStringIntersection(initializer.link, target.link);
    }
    
    return new Decoration(initializer);
  }
  
  private static getBooleanIntersection(current?: boolean, target?: boolean) {
    return current === false ? current : !!target;
  }
  
  private static getStringIntersection(current?: string, target?: string) {
    if (current === undefined && target !== undefined) return target;
    if (current !== undefined && target === undefined) return current;
    if (current === undefined || target === undefined || target !== current) return "";
    return current;
  }
  
  public static parseHTML(node: HTMLElement, decoration: Initializer<Decoration> = {}) {
    const {fontSize, fontFamily, color, backgroundColor} = node.style;
    const [font_size, font_size_length] = fontSize.split(/(?<=[0-9]+)(?=[a-z]+)/);
    
    return new Decoration({
      link:          node instanceof HTMLAnchorElement ? node.href : decoration.link,
      bold:          node.tagName === "B" || node.tagName === "STRONG" || decoration.bold,
      italic:        node.tagName === "I" || decoration.italic,
      underline:     node.tagName === "U" || decoration.underline,
      strikethrough: node.tagName === "S" || decoration.strikethrough,
      code:          node.tagName === "CODE" || decoration.code,
      mark:          node.tagName === "MARK" || decoration.mark,
      
      font_family:      fontFamily || decoration.font_family || Decoration.defaultFontFamily,
      font_size:        font_size || decoration.font_size || Decoration.defaultFontSize,
      font_length:      font_size_length || decoration.font_length || Decoration.defaultFontLength,
      
      color:            color || decoration.color || "",
      background_color: backgroundColor || decoration.background_color || "",
      
      selected: decoration.selected ?? false,
    });
  }
  
}

export type DecorationObject = Omit<Writeable<Properties<Decoration>>, "selected">;
