import styled from "styled-components";
import TextBox from "./TextBox";
import { Point, Range, Size } from "../lib/figure";
import { TextIndex } from "../lib/selection";
import { TextObj } from "../lib/text";

const Svg = styled.svg`
  display: block;
  position: absolute;
  top: 0;
  left: 0;
`;

interface DrawTextSvgProps {
  text: TextObj;
  origin: Point;
  size: Size;
  selection: Range<TextIndex> | undefined;
}

const DrawTextSvg = ({ text, origin, size, selection }: DrawTextSvgProps) => {
  return (
    <>
      <Svg width={size.w} height={size.h}>
        <g transform={`translate(${origin.x}, ${origin.y})`}>
          <TextBox text={text} selection={selection} />
        </g>
      </Svg>
    </>
  );
};

export default DrawTextSvg;
