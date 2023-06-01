export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export const rectContainsPoint = (rect: Rect, point: Point) =>
  rect.x <= point.x &&
  point.x <= rect.x + rect.w &&
  rect.y <= point.y &&
  point.y <= rect.y + rect.h;

export const circleContainsPoint = (circle: Circle, point: Point) =>
  getDistance(circle, point) <= circle.r;

export const getDistance = (p0: Point, p1: Point) =>
  Math.sqrt((p0.x - p1.x) ** 2 + (p0.y - p1.y) ** 2);
