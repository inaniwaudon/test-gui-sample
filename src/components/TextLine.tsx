import React from "react";
import styled, { css, keyframes } from "styled-components";
import { selectionColor, symbolOffset } from "../const/styles";
import { Range, Rect } from "../lib/figure";
import {
  isAfterTextIndex,
  isBeforeTextIndex,
  isCollapsedSelection,
  sortSelection,
  TextIndex,
} from "../lib/selection";
import { Line } from "../lib/text";
import { calculateItemRects } from "../lib/typeset";

const CursorFlicker = keyframes`
  0% {
    opacity: 1;
  }
  49% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  99% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const SvgText = styled.text<{ vertical: boolean }>`
  font-family: "FOT-筑紫明朝 Pr6 B";
  writing-mode: ${({ vertical }) => (vertical ? "tb" : "lr")};
  user-select: none;
`;

const Selection = styled.rect<{ isCursor: boolean }>`
  fill: ${selectionColor};
  animation: ${({ isCursor }) =>
    isCursor
      ? css`
          ${CursorFlicker} 1s infinite
        `
      : "none"};
`;

interface TextLineProps {
  line: Line;
  position: number;
  height: number;
  selection?: Range<TextIndex>;
  textIndex: TextIndex;
  vertical: boolean;
}

const TextLine = ({
  line,
  position,
  height,
  selection,
  textIndex,
  vertical,
}: TextLineProps) => {
  const itemRects = calculateItemRects(line);
  const itemPositions = itemRects.map((rect) => rect.x);
  const cursorWidth = 2;
  const verticalLeft = position - height;

  const selectionRect: Rect | undefined = (() => {
    if (!selection) {
      return;
    }
    const fromTextIndex = structuredClone(textIndex);
    const toTextIndex = structuredClone(textIndex);
    fromTextIndex.item = 0;
    toTextIndex.item = line.items.length;
    const sortedSelection = sortSelection(selection);
    if (
      isBeforeTextIndex(fromTextIndex, sortedSelection.to) ||
      isAfterTextIndex(toTextIndex, sortedSelection.from)
    ) {
      return;
    }

    const isCollapsed = isCollapsedSelection(selection);
    if (itemRects.length === 0) {
      if (isCollapsed) {
        return {
          x: vertical ? verticalLeft : 0,
          y: vertical ? 0 : position,
          w: vertical ? line.fontSize : cursorWidth,
          h: vertical ? cursorWidth : line.fontSize,
        };
      }
      return;
    }

    const lineSelection = {
      from: isBeforeTextIndex(fromTextIndex, sortedSelection.from)
        ? 0
        : sortedSelection.from.item,
      to: isAfterTextIndex(toTextIndex, sortedSelection.to)
        ? line.items.length
        : sortedSelection.to.item,
    };
    const fromX =
      lineSelection.from < itemRects.length
        ? itemRects[lineSelection.from].x
        : itemRects.at(-1)!.x + itemRects.at(-1)!.w;
    const toX =
      lineSelection.to < itemRects.length
        ? itemRects[lineSelection.to].x
        : itemRects.at(-1)!.x + itemRects.at(-1)!.w;
    const width = isCollapsed ? cursorWidth : toX - fromX;
    return {
      x: vertical ? verticalLeft : fromX,
      y: vertical ? fromX : position,
      w: vertical ? line.fontSize : width,
      h: vertical ? width : line.fontSize,
    };
  })();

  const textX = vertical
    ? position - height / 2
    : itemPositions.map((position) => position).join(",");
  const textY = vertical
    ? itemPositions.map((position) => position).join(",")
    : position + line.fontSize * 0.88;

  return (
    <>
      {selection && selectionRect && (
        <Selection
          x={selectionRect.x + symbolOffset}
          y={selectionRect.y + symbolOffset}
          width={selectionRect.w}
          height={selectionRect.h}
          isCursor={isCollapsedSelection(selection)}
        />
      )}
      {
        <SvgText
          fontSize={line.fontSize}
          vertical={vertical}
          x={textX}
          y={textY}
        >
          {line.items
            .flatMap((item) => (item.type === "char" ? item.content : []))
            .join("")}
        </SvgText>
      }
    </>
  );
};

export default TextLine;
