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

export interface Size {
  w: number;
  h: number;
}

export type Direction = "top" | "left" | "bottom" | "right";

export type Range<T> = { from: T; to: T };

export const rectContainsPoint = (rect: Rect, point: Point) =>
  ((rect.w >= 0 && rect.x <= point.x && point.x <= rect.x + rect.w) ||
    (rect.w < 0 && rect.x + rect.w <= point.x && point.x <= rect.x)) &&
  ((rect.h >= 0 && rect.y <= point.y && point.y <= rect.y + rect.h) ||
    (rect.h < 0 && rect.y + rect.h <= point.y && point.y <= rect.y));

export const circleContainsPoint = (circle: Circle, point: Point) =>
  getDistance(circle, point) <= circle.r;

export const getDistance = (p0: Point, p1: Point) =>
  Math.sqrt((p0.x - p1.x) ** 2 + (p0.y - p1.y) ** 2);
