import styled, { css, keyframes } from "styled-components";
import { selectionColor } from "@/const/styles";
import { Range, Rect } from "@/lib/figure";
import {
  isAfterTextIndex,
  isBeforeTextIndex,
  isCollapsedSelection,
  sortSelection,
  TextIndex,
} from "@/lib/text/selection";
import { Line } from "@/lib/text/text";
import { calculateItemRects } from "@/lib/text/typeset";

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

const SvgText = styled.text`
  user-select: none;
`;

const SvgChar = styled.tspan<{ font: "mincho" | "gothic" }>`
  font-family: ${({ font }) =>
    font === "mincho" ? "FOT-筑紫明朝 Pr6 B" : "FOT-筑紫ゴシック Pro H"};
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
}

const TextLine = ({
  line,
  position,
  height,
  selection,
  textIndex,
}: TextLineProps) => {
  const itemRects = calculateItemRects(line);
  const itemPositions = itemRects.map((rect) => rect.x);
  const cursorWidth = 2;

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
          x: 0,
          y: position,
          w: cursorWidth,
          h: line.fontSize,
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
      x: fromX,
      y: position,
      w: width,
      h: line.fontSize,
    };
  })();

  const textX = itemPositions.map((position) => position).join(",");
  const textY = position + line.fontSize * 0.88;

  return (
    <>
      {selection && selectionRect && (
        <Selection
          x={selectionRect.x}
          y={selectionRect.y}
          width={selectionRect.w}
          height={selectionRect.h}
          isCursor={isCollapsedSelection(selection)}
        />
      )}
      {
        <SvgText fontSize={line.fontSize} x={textX} y={textY}>
          {line.items.map((char, index) => (
            <SvgChar font={char.font} key={index}>
              {char.content}
            </SvgChar>
          ))}
        </SvgText>
      }
    </>
  );
};

export default TextLine;
