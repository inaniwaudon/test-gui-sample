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

export const rectContainsPoint = (rect: Rect, point: Point) =>
  rect.x <= point.x &&
  point.x <= rect.x + rect.w &&
  rect.y <= point.y &&
  point.y <= rect.y + rect.h;
