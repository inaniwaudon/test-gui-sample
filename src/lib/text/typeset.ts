import { Rect } from "../figure";
import { getCharWidth } from "./metrics";
import { Line, LineHeight, TextObj } from "./text";

export const calculateItemRects = (line: Line): Rect[] => {
  let x = 0;
  const rects: Rect[] = [];
  for (const item of line.items) {
    if (item.type === "char") {
      x += (line.fontSize * item.kerning) / 1000;
      const width = line.fontSize * getCharWidth(item.content);
      rects.push({ x, y: 0, w: width, h: line.fontSize });
      x += width;
    }
  }
  return rects;
};

const getLineHeight = (lineHeight: LineHeight, fontSize: number) =>
  lineHeight.unit === "fixed"
    ? lineHeight.number
    : lineHeight.number * fontSize;

export const calculateLineRects = (text: TextObj) => {
  const rects: Rect[] = [];
  let y = 0;
  for (const line of text.lines) {
    const lineHeight = getLineHeight(line.lineHeight, line.fontSize);
    const itemRects = calculateItemRects(line);
    const width = Math.max(...itemRects.map((rect) => rect.x + rect.w));
    const height =
      itemRects.length > 0
        ? Math.max(...itemRects.map((rect) => rect.h))
        : line.fontSize;
    rects.push({ x: 0, y, w: width, h: height });
    y += lineHeight;
  }
  return rects;
};

export const calculateTextBoundingBox = (text: TextObj): Rect => {
  const lineRects = calculateLineRects(text);
  const height = Math.max(...lineRects.map((rect) => rect.y + rect.h));
  const width = Math.max(...lineRects.map((rect) => rect.w));
  return {
    ...text.position,
    w: width,
    h: height,
  };
};
