import styled from "styled-components";
import TextBox from "./TextBox";
import { Point, Range, Size } from "@/lib/figure";
import { TextIndex } from "@/lib/text/selection";
import { TextObj } from "@/lib/text/text";

const Svg = styled.svg`
  display: block;
  position: absolute;
  top: 0;
  left: 0;
`;

interface DrawTextSvgProps {
  text: TextObj;
  size: Size;
  selection: Range<TextIndex> | undefined;
}

const DrawTextSvg = ({ text, size, selection }: DrawTextSvgProps) => {
  return (
    <>
      <Svg width={size.w} height={size.h}>
        <TextBox text={text} selection={selection} />
      </Svg>
    </>
  );
};

export default DrawTextSvg;
