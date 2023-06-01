import { Direction, Point, Range, Rect } from "./figure";
import { getCharLeft, Line, TextObj } from "./text";
import { calculateItemRects, calculateLineRects } from "./typeset";

export interface TextIndex {
  line: number;
  item: number;
}

// TextIndex
export const getHeadTextIndex = () => ({
  line: 0,
  item: 0,
});

export const getTailTextIndex = (text: TextObj) => ({
  line: text.lines.length - 1,
  item: text.lines.at(-1)!.items.length,
});

export const equalsTextIndex = (a: TextIndex, b: TextIndex) =>
  a.line === b.line && a.item === b.item;

export const isAfterTextIndex = (a: TextIndex, b: TextIndex) =>
  a.line < b.line || (a.line === b.line && a.item < b.item);

export const isBeforeTextIndex = (a: TextIndex, b: TextIndex) =>
  !equalsTextIndex(a, b) && !isAfterTextIndex(a, b);

const isHeadTextIndex = (index: TextIndex) =>
  equalsTextIndex(index, getHeadTextIndex());

const isTailTextIndex = (index: TextIndex, text: TextObj) =>
  equalsTextIndex(index, getTailTextIndex(text));

export const backTextIndex = (index: TextIndex, text: TextObj): TextIndex => {
  // 行内
  if (index.item > 0) {
    return {
      ...index,
      item: index.item - 1,
    };
  }
  // 前行
  if (index.line > 0) {
    return {
      line: index.line - 1,
      item: text.lines[index.line - 1].items.length,
    };
  }
  return index;
};

export const nextTextIndex = (index: TextIndex, text: TextObj): TextIndex => {
  // 行内
  if (index.item < text.lines[index.line].items.length) {
    return {
      ...index,
      item: index.item + 1,
    };
  }
  // 次行
  if (index.line < text.lines.length - 1) {
    return {
      line: index.line + 1,
      item: 0,
    };
  }
  return index;
};

// selection
const getItemIndex = (line: Line, point: number) => {
  const itemRects = calculateItemRects(line);
  for (let itemi = 0; itemi < line.items.length; itemi++) {
    const itemRect = itemRects[itemi];
    if (itemRect.x <= point && point <= itemRect.x + itemRect.w) {
      return itemi + (itemRect.x + itemRect.w / 2 < point ? 1 : 0);
    }
  }
};

const getTextIndex = (text: TextObj, point: Point) => {
  const isVertical = text.writingMode === "vertical";
  const relativePoint: Point = {
    x: point.x - text.position.x,
    y: point.y - text.position.y,
  };
  const x = isVertical ? relativePoint.y : relativePoint.x;
  const y = isVertical ? relativePoint.x : relativePoint.y;
  const lineRects = calculateLineRects(text);

  for (let linei = 0; linei < text.lines.length; linei++) {
    const line = text.lines[linei];
    if (
      isVertical
        ? y <= -lineRects[linei].y &&
          -lineRects[linei].y - lineRects[linei].h <= y
        : lineRects[linei].y <= y &&
          y <= lineRects[linei].y + lineRects[linei].h
    ) {
      const itemIndex = getItemIndex(line, x);
      if (itemIndex !== undefined) {
        return {
          line: linei,
          item: itemIndex,
        };
      }
    }
  }
};

export const getTextSelection = (
  text: TextObj,
  pointRange: Range<Point>
): Range<TextIndex> | undefined => {
  const fromTextIndex = getTextIndex(text, pointRange.from);
  const toTextIndex = getTextIndex(text, pointRange.to);
  if (fromTextIndex && toTextIndex) {
    return {
      from: fromTextIndex,
      to: toTextIndex,
    };
  }
};

export const sortSelection = (selection: Range<TextIndex>) => {
  if (isAfterTextIndex(selection.to, selection.from)) {
    return {
      from: selection.to,
      to: selection.from,
    };
  }
  return selection;
};

export const isAllSelection = (selection: Range<TextIndex>, text: TextObj) =>
  isHeadTextIndex(selection.from) && isTailTextIndex(selection.to, text);

export const isCollapsedSelection = (selection: Range<TextIndex>) =>
  equalsTextIndex(selection.from, selection.to);

export const moveSelection = (
  selection: Range<TextIndex>,
  direction: Direction,
  isShift: boolean,
  text: TextObj
): Range<TextIndex> => {
  const sortedSelection = sortSelection(selection);

  // 水平方向
  const isCollapsed = isCollapsedSelection(selection);
  if (direction === "right") {
    if (isShift) {
      return { from: selection.from, to: nextTextIndex(selection.to, text) };
    }
    if (isCollapsed) {
      const nextIndex = nextTextIndex(selection.from, text);
      return { from: nextIndex, to: nextIndex };
    }
    return { from: sortedSelection.to, to: sortedSelection.to };
  }
  if (direction === "left") {
    if (isShift) {
      return { from: selection.from, to: backTextIndex(selection.to, text) };
    }
    if (isCollapsed) {
      const previousIndex = backTextIndex(selection.from, text);
      return { from: previousIndex, to: previousIndex };
    }
    return { from: sortedSelection.from, to: sortedSelection.from };
  }

  // 垂直方向
  const currentRects = calculateItemRects(text.lines[selection.from.line]);

  const getMinDiffIndex = (currentLeft: number, rects: Rect[]) => {
    const lefts = [
      ...rects.map((rect) => rect.x),
      getCharLeft(rects.length, rects),
    ];
    let minIndex = 0;
    let minDiff = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < lefts.length; i++) {
      const diff = Math.abs(currentLeft - lefts[i]);
      if (diff < minDiff) {
        minIndex = i;
        minDiff = diff;
      }
    }
    return minIndex;
  };

  if (direction === "top") {
    let previousIndex = getHeadTextIndex();
    if (selection.to.line > 0) {
      const currentLeft = getCharLeft(selection.to.item, currentRects);
      const minIndex = getMinDiffIndex(
        currentLeft,
        calculateItemRects(text.lines[selection.to.line - 1])
      );
      previousIndex = {
        line: selection.to.line - 1,
        item: minIndex,
      };
    }
    if (isShift) {
      return {
        from: selection.from,
        to: previousIndex,
      };
    }
    return {
      from: previousIndex,
      to: previousIndex,
    };
  }
  if (direction === "bottom") {
    let nextIndex = getTailTextIndex(text);
    if (selection.to.line < text.lines.length - 1) {
      console.log(selection.to);
      const currentLeft = getCharLeft(selection.to.item, currentRects);
      const minIndex = getMinDiffIndex(
        currentLeft,
        calculateItemRects(text.lines[selection.to.line + 1])
      );
      nextIndex = {
        line: selection.to.line + 1,
        item: minIndex,
      };
    }
    if (isShift) {
      return {
        from: selection.from,
        to: nextIndex,
      };
    }
    return {
      from: nextIndex,
      to: nextIndex,
    };
  }

  return { ...selection };
};

export const sliceLinesWithSelection = (
  selection: Range<TextIndex>,
  text: TextObj
) => {
  const sortedSelection = sortSelection(selection);
  const newText: TextObj = structuredClone(text);
  const lines = newText.lines.filter(
    (_, index) =>
      sortedSelection.from.line <= index && index <= sortedSelection.to.line
  );
  lines.at(-1)!.items = lines.at(-1)!.items.slice(0, sortedSelection.to.item);
  lines[0].items = lines[0].items.slice(sortedSelection.from.item);
  return newText;
};
