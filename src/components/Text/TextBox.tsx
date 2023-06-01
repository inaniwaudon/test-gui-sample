import styled from "styled-components";
import TextLine from "./TextLine";
import { keyColor } from "@/const/styles";
import { Range } from "@/lib/figure";
import { TextIndex } from "@/lib/text/selection";
import { TextObj } from "@/lib/text/text";
import {
  calculateLineRects,
  calculateTextBoundingBox,
} from "@/lib/text/typeset";

const Bounding = styled.rect`
  fill: none;
  stroke: ${keyColor};
`;

interface TextBoxProps {
  text: TextObj;
  selection: Range<TextIndex> | undefined;
}

const TextBox = ({ text, selection }: TextBoxProps) => {
  const boundingBox = calculateTextBoundingBox(text);
  const isVertical = text.writingMode === "vertical";
  const x = text.position.x - (isVertical ? boundingBox.w : 0);
  const lineRects = calculateLineRects(text);
  const linePositions = lineRects.map((rect) =>
    isVertical ? boundingBox.w - rect.y : rect.y
  );

  return (
    <g transform={`translate(${x}, ${text.position.y})`}>
      {true && (
        <Bounding x={0} y={0} width={boundingBox.w} height={boundingBox.h} />
      )}
      {text.lines.map((line, lineIndex) => {
        const textIndex = {
          line: lineIndex,
          item: -1,
        };
        return (
          <TextLine
            line={line}
            position={linePositions[lineIndex]}
            height={lineRects[lineIndex].h}
            selection={selection}
            textIndex={textIndex}
            vertical={text.writingMode === "vertical"}
            key={lineIndex}
          />
        );
      })}
    </g>
  );
};

export default TextBox;
