import { Point, Range, Rect } from "./figure";
import { nextTextIndex, sortSelection, TextIndex } from "./selection";

export interface Char {
  type: "char";
  content: string;
  kerning: number;
  background?: string;
}

export interface TabItem {
  type: "tab";
}

type TextItem = Char | TabItem;

export interface LineHeight {
  number: number;
  unit: "fixed" | "%";
}

export interface Line {
  items: TextItem[];
  fontSize: number;
  lineHeight: LineHeight;
}

export interface TextObj {
  type: "text";
  position: Point;
  lines: Line[];
  tabs: Tab[];
  writingMode: "horizontal" | "vertical";
}

export interface Tab {
  x: number;
  align: "left" | "right" | "center" | "justify";
}

const textToItems = (text: string): TextItem[] =>
  text.split("").map((char) =>
    char === "\t"
      ? { type: "tab" }
      : {
          type: "char",
          content: char,
          kerning: 0,
        }
  );

export const textToLines = (text: string): Line[] =>
  text.split("\n").map((line) => ({
    items: textToItems(line),
    fontSize: 60,
    lineHeight: {
      number: 80,
      unit: "fixed",
    },
  }));

export const createDefaultText = (): TextObj => ({
  type: "text",
  position: { x: 0, y: 0 },
  lines: textToLines("テキストを入力"),
  tabs: [
    { x: 10, align: "left" },
    { x: 100, align: "center" },
    { x: 200, align: "right" },
  ],
  writingMode: "horizontal",
});

export const getCharLeft = (index: number, rects: Rect[]) =>
  index < rects.length
    ? rects[index].x
    : rects.length > 0
    ? rects.at(-1)!.x + rects.at(-1)!.w
    : 0;

export const setKerning = (
  text: TextObj,
  delta: number,
  selection: Range<TextIndex>
) => {
  const sortedSelection = sortSelection(selection);
  for (
    let linei = sortedSelection.from.line;
    linei <= sortedSelection.to.line;
    linei++
  ) {
    const fromItemi =
      linei === sortedSelection.from.line ? sortedSelection.from.item : 0;
    const toItemi =
      linei === sortedSelection.to.line
        ? sortedSelection.to.item
        : text.lines[linei].items.length - 1;

    for (let itemi = fromItemi; itemi <= toItemi; itemi++) {
      const item = text.lines[linei].items[itemi];
      if (item.type === "char") {
        item.kerning += delta;
      }
    }
  }
};

export const addCharsToText = (
  text: TextObj,
  value: string,
  selection: Range<TextIndex>
): Range<TextIndex> => {
  const sortedSelection = sortSelection(selection);
  const line = text.lines[selection.from.line];
  text.lines[selection.from.line].items = [
    ...line.items.slice(0, sortedSelection.from.item),
    ...textToItems(value),
    ...line.items.slice(sortedSelection.to.item),
  ];
  const index = {
    ...selection.from,
    item: selection.from.item + value.length,
  };
  return {
    from: index,
    to: index,
  };
};

export const deleteCharsFromText = (
  text: TextObj,
  selection: Range<TextIndex>
): Range<TextIndex> => {
  const sortedSelection = sortSelection(selection);
  const beforeLines = text.lines.slice(0, selection.from.line);
  const afterLines = text.lines.slice(selection.to.line + 1);
  const line = structuredClone(text.lines[selection.from.line]);
  line.items = [
    ...line.items.slice(0, selection.from.item),
    ...text.lines[selection.to.line].items.slice(selection.to.item),
  ];
  text.lines = [...beforeLines, line, ...afterLines];
  return { from: sortedSelection.from, to: sortedSelection.from };
};

export const breakLineText = (
  text: TextObj,
  index: TextIndex
): Range<TextIndex> => {
  const beforeLines = text.lines.slice(0, index.line);
  const afterLines = text.lines.slice(index.line + 1);
  const newBeforeLine = structuredClone(text.lines[index.line]);
  const newAfterLine = structuredClone(text.lines[index.line]);
  newBeforeLine.items = newBeforeLine.items.slice(0, index.item);
  newAfterLine.items = newAfterLine.items.slice(index.item);
  text.lines = [...beforeLines, newBeforeLine, newAfterLine, ...afterLines];
  return {
    from: nextTextIndex(index, text),
    to: nextTextIndex(index, text),
  };
};
