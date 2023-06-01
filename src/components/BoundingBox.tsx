import React, { useRef, useState } from "react";
import styled from "styled-components";
import { Point, Rect, rectContainsPoint } from "@/lib/figure";

const rectSize = 10;

const Wrapper = styled.div`
  width: 100vw;
  height: 100%;
`;

const Box = styled.div<{
  x: number;
  y: number;
  w: number;
  h: number;
}>`
  width: ${({ w }) => w}px;
  height: ${({ h }) => h}px;
  user-select: none;
  pointer-events: none;
  position: relative;
  top: ${({ y }) => y}px;
  left: ${({ x }) => x}px;
`;

const CornerRect = styled.div<{ x: number; y: number; hover: boolean }>`
  width: ${rectSize}px;
  height: ${rectSize}px;
  border: solid 2px #c00;
  background: ${({ hover }) => (hover ? "#c00" : "#fff")};
  position: absolute;
  top: ${({ y }) => y}px;
  left: ${({ x }) => x}px;
  z-index: 1;
`;

const BgRect = styled.div<{ flipHorizontal: boolean; flipVertical: boolean }>`
  width: 100%;
  height: 100%;
  border: solid 2px #c00;
  transform: scale(
    ${({ flipHorizontal }) => (flipHorizontal ? -1 : 1)},
    ${({ flipVertical }) => (flipVertical ? -1 : 1)}
  );
  transform-origin: top left;
  position: absolute;
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
`;

const BoundingBox = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [baseRect, setBaseRect] = useState<Rect>({
    x: 50,
    y: 50,
    w: 474,
    h: 326,
  });
  const [cornerNo, setCornerNo] = useState<number | "move">();
  const [downPoint, setDownPoint] = useState<Point>();
  const [downRect, setDownRect] = useState<Rect>();

  const center = (baseRect.w - rectSize) / 2;
  const right = baseRect.w - rectSize / 2;
  const middle = (baseRect.h - rectSize) / 2;
  const bottom = baseRect.h - rectSize / 2;

  const rects: (Point & {
    align: ("top" | "middle" | "bottom" | "left" | "center" | "right")[];
  })[] = [
    { x: -rectSize / 2, y: -rectSize / 2, align: ["top", "left"] },
    { x: center, y: -rectSize / 2, align: ["top"] },
    { x: right, y: -rectSize / 2, align: ["top", "right"] },
    { x: -rectSize / 2, y: middle, align: ["left"] },
    { x: right, y: middle, align: ["right"] },
    { x: -rectSize / 2, y: bottom, align: ["bottom", "left"] },
    { x: center, y: bottom, align: ["bottom"] },
    { x: right, y: bottom, align: ["bottom", "right"] },
  ];

  const getMousePos = (e: React.MouseEvent) => {
    if (!wrapperRef.current) {
      return { x: 0, y: 0 };
    }
    const rect = wrapperRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.x, y: e.clientY - rect.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const mousePos = getMousePos(e);

    if (cornerNo !== undefined && downPoint && downRect) {
      const diffX = mousePos.x - downPoint.x;
      const diffY = mousePos.y - downPoint.y;
      const newRect = { ...baseRect };

      if (cornerNo === "move") {
        newRect.x = downRect.x + diffX;
        newRect.y = downRect.y + diffY;
      } else {
        if (rects[cornerNo].align.includes("left")) {
          newRect.x = downRect.x + diffX;
          newRect.w = downRect.w - diffX;
        }
        if (rects[cornerNo].align.includes("top")) {
          newRect.y = downRect.y + diffY;
          newRect.h = downRect.h - diffY;
        }
        if (rects[cornerNo].align.includes("right")) {
          newRect.x = downRect.x;
          newRect.w = downRect.w + diffX;
        }
        if (rects[cornerNo].align.includes("bottom")) {
          newRect.y = downRect.y;
          newRect.h = downRect.h + diffY;
        }
      }
      setBaseRect(newRect);
      return;
    }

    for (let i = 0; i < rects.length; i++) {
      const contains = rectContainsPoint(
        {
          x: baseRect.x + rects[i].x,
          y: baseRect.y + rects[i].y,
          w: rectSize,
          h: rectSize,
        },
        mousePos
      );
      if (contains) {
        setCornerNo(i);
        return;
      }
    }
    setCornerNo(rectContainsPoint(baseRect, mousePos) ? "move" : undefined);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (cornerNo !== undefined) {
      setDownPoint(getMousePos(e));
      setDownRect({ ...baseRect });
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    setDownPoint(undefined);
    setDownRect(undefined);
  };

  return (
    <Wrapper
      ref={wrapperRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <Box
        x={baseRect.x}
        y={baseRect.y}
        w={Math.abs(baseRect.w)}
        h={Math.abs(baseRect.h)}
      >
        {rects.map((rect, i) => (
          <CornerRect x={rect.x} y={rect.y} hover={i === cornerNo} key={i} />
        ))}
        <BgRect flipHorizontal={baseRect.w < 0} flipVertical={baseRect.h < 0}>
          <Img src="nomaneko.webp" alt="キープだ牛" />
        </BgRect>
      </Box>
    </Wrapper>
  );
};

export default BoundingBox;
