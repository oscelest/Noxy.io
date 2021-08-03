import _ from "lodash";
import Point from "./Point";

export default class Rect {

  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(x: number = -Infinity, y: number = -Infinity, width: number = -Infinity, height: number = -Infinity) {
    this.x = x ?? -Infinity;
    this.y = y ?? -Infinity;
    this.width = width ?? -Infinity;
    this.height = height ?? -Infinity;
  }

  public static fromDOMRect({left, top, width, height}: DOMRect) {
    return new this(left, top, width, height);
  }

  public static fromPoints(a: Point, b: Point) {
    const {x1, x2, y1, y2} = Point.normalizePoints(a, b);
    return new Rect(x1, y1, x2 - x1, y2 - y1);
  };

  public static overlaps(a: Rect | DOMRect, b: Rect | DOMRect) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  public static union(...rects: (Rect | DOMRect)[]) {
    if (rects.length === 0) return new Rect();
    if (rects.length === 1) return new Rect(rects[0].x, rects[0].y, rects[0].width, rects[0].height);
    const x = Math.min(..._.map(rects, rect => rect.x));
    const y = Math.min(..._.map(rects, rect => rect.y));
    const width = Math.max(..._.map(rects, rect => rect.width + rect.x - x));
    const height = Math.max(..._.map(rects, rect => rect.height + rect.y - y));
    return new Rect(x, y, width, height);
  }

  public isEqual(...target: (Rect | undefined)[]) {
    return _.every(target, rect => rect instanceof Rect && rect.isFinite() && rect.x === this.x && rect.y === this.y && rect.width === this.width && rect.height === this.height);
  }

  public isEqualPosition(...target: (Rect | undefined)[]) {
    return _.every(target, rect => rect instanceof Rect && rect.isFinitePosition() && rect.x === this.x && rect.y === this.y);
  }

  public isEqualDimension(...target: (Rect | undefined)[]) {
    return _.every(target, rect => rect instanceof Rect && rect.isFiniteDimension() && rect.width === this.width && rect.height === this.height);
  }

  public isFinite() {
    return this.isFinitePosition() && this.isFiniteDimension();
  }

  public isFinitePosition() {
    return Number.isFinite(this.x) && Number.isFinite(this.y);
  }

  public isFiniteDimension() {
    return Number.isFinite(this.width) && Number.isFinite(this.height);
  }

  public resize(x: number, y: number, width: number, height: number) {
    return new Rect(this.x + x, this.y + y, this.width + width, this.height + height);
  };

  public translate(x: number, y: number) {
    return new Rect(this.x + x, this.y + y, this.width, this.height);
  }

  public getPointOffset(point: Point) {
    const offset = new Point(0, 0);

    if (point.x < this.x) {
      offset.x = point.x - this.x;
    }
    else if (point.x > this.x + this.width) {
      offset.x = point.x - this.x - this.width;
    }

    if (point.y < this.y) {
      offset.y = point.y - this.y;
    }
    else if (point.y > this.y + this.height) {
      offset.y = point.y - this.y - this.height;
    }

    return offset;
  }

  public getCenter() {
    return new Point(this.x + this.width / 2, this.y + this.height / 2);
  }

  public getCorners() {
    return {
      top_left:     new Point(this.x, this.y),
      top_right:    new Point(this.x + this.width, this.y),
      bottom_left:  new Point(this.x, this.y + this.height),
      bottom_right: new Point(this.x + this.width, this.y + this.height),
    };
  }

  public anchorToRect({x, y}: Rect | DOMRect) {
    return new Rect(this.x - x, this.y - y, this.width, this.height);
  }

  public containsPoint(point: Point) {
    return point.x > this.x && point.x < this.x + this.width && point.y > this.y && point.y < this.y + this.height;
  }

  public containsRect(rect: Rect) {
    return _.every(rect.getCorners(), this.containsPoint.bind(this));
  }

  public overlapsRect(rect: Rect) {
    return this.x < rect.x + rect.width && this.x + this.width > rect.x && this.y < rect.y + rect.height && this.y + this.height > rect.y;
  }

  public toViewBox() {
    return `${this.x} ${this.y} ${this.width} ${this.height}`
  }

  public toCSS() {
    return {left: `${this.x}px`, top: `${this.y}px`, width: `${this.width}px`, height: `${this.height}px`};
  }
}
