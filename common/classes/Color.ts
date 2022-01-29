import Util from "../services/Util";

export default class Color {

  public readonly red: number;
  public readonly green: number;
  public readonly blue: number;

  public readonly value: number;
  public readonly hue: number;
  public readonly saturation: number;

  public readonly alpha: number;

  private static max_rgb = 255;
  private static max_alpha = 1;

  constructor(color: RGBColor | HSVColor | string, alpha: number = 1) {
    this.alpha = Util.clamp(alpha, Color.max_alpha);
    if (typeof color === "string") {
      const match = color.match(/^#(?<red>[A-F0-9]{2})?(?<green>[A-F0-9]{2})?(?<blue>[A-F0-9]{2})?/i);
      if (!match?.groups) throw new Error("Could not read hex color.");
      this.red = Util.clamp(parseInt(match.groups.red ?? 0, 16), Color.max_rgb);
      this.green = Util.clamp(parseInt(match.groups.green ?? 0, 16), Color.max_rgb);
      this.blue = Util.clamp(parseInt(match.groups.blue ?? 0, 16), Color.max_rgb);
    }
    else {
      const {red, green, blue} = color as RGBColor;
      const {hue, saturation, value} = color as HSVColor;
      if (red !== undefined && blue !== undefined && green !== undefined) {
        this.red = Util.clamp(Math.round(red), Color.max_rgb);
        this.green = Util.clamp(Math.round(green), Color.max_rgb);
        this.blue = Util.clamp(Math.round(blue), Color.max_rgb);
      }
      else if (hue !== undefined && saturation !== undefined && value !== undefined) {
        this.hue = Util.clamp(hue, 1);
        this.saturation = Util.clamp(saturation, 1);
        this.value = Util.clamp(value, 1);
      }
      else {
        throw new Error("Could not generate color");
      }
    }

    if (this.red !== undefined && this.blue !== undefined && this.green !== undefined) {
      const red = this.red / 255;
      const green = this.green / 255;
      const blue = this.blue / 255;

      const min_value = Math.min(red, green, blue);
      const max_value = Math.max(red, green, blue);
      const diff = max_value - min_value;

      this.value = max_value;
      this.saturation = max_value == 0 ? 0 : diff / max_value;

      if (min_value == max_value) {
        this.hue = 0;
      }
      else {
        switch (max_value) {
          case red:
            this.hue = (green - blue) / diff + (green < blue ? 6 : 0);
            break;
          case green:
            this.hue = (blue - red) / diff + 2;
            break;
          case blue:
            this.hue = (red - green) / diff + 4;
            break;
        }

        this.hue /= 6;
      }
    }
    else {
      const i = Math.floor(this.hue * 6);
      const f = this.hue * 6 - i;
      const v = Math.round(this.value * 255);
      const p = Math.round(this.value * (1 - this.saturation) * 255);
      const q = Math.round(this.value * (1 - f * this.saturation) * 255);
      const t = Math.round(this.value * (1 - (1 - f) * this.saturation) * 255);

      switch (i % 6) {
        case 0:
          this.red = v;
          this.green = t;
          this.blue = p;
          break;
        case 1:
          this.red = q;
          this.green = v;
          this.blue = p;
          break;
        case 2:
          this.red = p;
          this.green = v;
          this.blue = t;
          break;
        case 3:
          this.red = p;
          this.green = q;
          this.blue = v;
          break;
        case 4:
          this.red = t;
          this.green = p;
          this.blue = v;
          break;
        case 5:
          this.red = v;
          this.green = p;
          this.blue = q;
          break;
      }
    }
  }

  public toHex() {
    return `#${Color.rgbToHex(this.red)}${Color.rgbToHex(this.green)}${Color.rgbToHex(this.blue)}`.toUpperCase();
  }

  public toHexAlpha(alpha?: number) {
    return `#${Color.rgbToHex(this.red)}${Color.rgbToHex(this.green)}${Color.rgbToHex(this.blue)}${Color.alphaToHex(alpha ?? this.alpha)}`.toUpperCase();
  }

  public toRGB() {
    return `rgb(${this.red}, ${this.green}, ${this.blue})`;
  }

  public toRGBA(alpha?: number) {
    return `rgba(${this.red}, ${this.green}, ${this.blue}, ${alpha ?? this.alpha})`;
  }

  public static alphaToHex(alpha: number) {
    return this.rgbToHex(+(Util.clamp(alpha, Color.max_alpha) * this.max_rgb / this.max_alpha).toPrecision(5));
  }

  public static rgbToHex(color: number) {
    const hex = Util.clamp(color, this.max_rgb).toString(16);
    return hex.length === 2 ? hex : hex.padStart(2, "0").substring(0, 2);
  }

}

export interface HSVColor {
  hue: number;
  saturation: number;
  value: number;
}

export interface RGBColor {
  red: number;
  green: number;
  blue: number;
}
