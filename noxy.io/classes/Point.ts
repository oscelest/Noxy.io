import _ from "lodash";
import React from "react";
import Rect from "./Rect";

export default class Point {

  public x: number;
  public y: number;

  constructor(x?: number, y?: number) {
    this.x = x ?? -Infinity;
    this.y = y ?? -Infinity;
  }

  public static fromMouseEvent(event: MouseEvent | React.MouseEvent) {
    return new Point(event.pageX, event.pageY);
  }

  public static fromPolarOffset(angle: number, offset: number) {
    return new Point(offset * Math.cos(angle * Math.PI / 180), offset * Math.sin(angle * Math.PI / 180));
  }

  public static normalizePoints(a: Point, b: Point) {
    return {x1: Math.min(a.x, b.x), x2: Math.max(a.x, b.x), y2: Math.max(a.y, b.y), y1: Math.min(a.y, b.y)};
  }

  public static getDistanceBetweenPoints(a: Point, b: Point) {
    const {x1, x2, y1, y2} = this.normalizePoints(a, b);
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  public toString(precision: number = 5) {
    return `${this.x.toPrecision(precision)},${this.y.toPrecision(precision)}`;
  }

  public isEqual(...target: (Point | undefined)[]) {
    return this.isFinite() && _.every(target, point => point instanceof Point && point.isFinite() && point.x === this.x && point.y === this.y);
  }

  public isFinite() {
    return Number.isFinite(this.x) && Number.isFinite(this.y);
  }

  public readonly invert = () => {
    return new Point(-this.x, -this.y);
  };

  public readonly translate = (x: number, y: number) => {
    return new Point(this.x + x, this.y + y);
  };

  public readonly confine = (rect: Rect, anchored: boolean = false) => {
    return new Point(
      anchored ? _.clamp(this.x, 0, rect.width) : _.clamp(this.x, rect.x, rect.x + rect.width),
      anchored ? _.clamp(this.y, 0, rect.height) : _.clamp(this.y, rect.y, rect.y + rect.height),
    );
  };

  public readonly anchorToRect = ({x, y}: Rect | DOMRect) => {
    return new Point(this.x - x, this.y - y);
  };
}
