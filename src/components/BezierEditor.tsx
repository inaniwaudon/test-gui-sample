import React, { useEffect, useMemo, useRef, useState } from "react";
import { PathCommand } from "opentype.js";
import styled from "styled-components";
import {
  Point,
  circleContainsPoint,
  getDistance,
  rectContainsPoint,
} from "../lib/figure";
import {
  commandsToPathD,
  PointType,
  rescaleCommands,
  scaleCommands,
} from "../lib/bezier";

const Path = styled.path<{ editing: boolean }>`
  fill: ${({ editing }) => (editing ? "none" : "#000")};
  stroke: ${({ editing }) => (editing ? "#000" : "none")};
  stroke-width: 2;
`;

const Rect = styled.rect`
  fill: none;
  stroke: #0c3;
  stroke-width: 2;
  &:hover {
    fill: #ccc;
  }
`;

const Circle = styled.circle`
  fill: #fff;
  stroke: #09c;
  stroke-width: 2;
  &:hover {
    fill: #ccc;
  }
`;

const HandleLine = styled.line`
  stroke: #ccc;
  stroke-width: 2;
`;

const radius = 8;

interface BezierEditorProps {
  commands: PathCommand[];
  unitsPerEm: number;
  size: number;
  tool: "view" | "move" | "pen";
  setCommands(value: PathCommand[]): void;
}

const getOffset = (size: number) => ({
  x: 0,
  y: size * 0.88,
});

const BezierEditor = ({
  commands,
  unitsPerEm,
  size,
  tool,
  setCommands,
}: BezierEditorProps) => {
  const scaledCommands = useMemo(
    () => scaleCommands(commands, unitsPerEm, size, getOffset(size)),
    [commands, unitsPerEm, size]
  );

  const setRestoredCommand = (newCommands: PathCommand[]) => {
    setCommands(
      rescaleCommands(newCommands, unitsPerEm, size, getOffset(size))
    );
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const [screenSize, setScreenSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [overedPoint, setOveredPoint] = useState<{
    index: number;
    type: PointType;
  }>();
  const [downedPoint, setDownedPoint] = useState<Point>();
  const [originalCommand, setOriginalCommand] = useState<PathCommand>();
  const [originalBeforeCommand, setOriginalBeforeCommand] =
    useState<PathCommand>();
  const [originalAfterCommand, setOriginalAfterCommand] =
    useState<PathCommand>();

  // circle
  const circles = scaledCommands
    .map((c, index) => ({ ...c, index }))
    .flatMap((c) => (c.type !== "Z" ? c : []));
  const curveCircles = circles.flatMap((c) => (c.type === "C" ? c : []));

  const pathD = commandsToPathD(scaledCommands);
  const editing = tool !== "view";

  // mouse event
  const onMouseDown = (e: React.MouseEvent) => {
    if (!svgRef.current) {
      return;
    }
    const bounding = svgRef.current.getBoundingClientRect();
    const x = e.clientX - bounding.x;
    const y = e.clientY - bounding.y;

    let index: number | undefined = undefined;
    for (const c of circles) {
      if (
        rectContainsPoint(
          {
            x: c.x - radius,
            y: c.y - radius,
            w: radius * 2,
            h: radius * 2,
          },
          { x, y }
        )
      ) {
        index = c.index;
        setOveredPoint({ index: c.index, type: "anchor" });
        break;
      }
      if (c.type === "C") {
        if (circleContainsPoint({ x: c.x1, y: c.y1, r: radius }, { x, y })) {
          index = c.index;
          setOveredPoint({ index: c.index, type: "p1" });
          break;
        }
        if (circleContainsPoint({ x: c.x2, y: c.y2, r: radius }, { x, y })) {
          index = c.index;
          setOveredPoint({ index: c.index, type: "p2" });
          break;
        }
      }
    }
    if (index === undefined) {
      return;
    }

    // move
    if (tool === "move") {
      setOriginalCommand(scaledCommands[index]);
      setOriginalBeforeCommand(scaledCommands[index - 1]);
      setOriginalAfterCommand(scaledCommands[index + 1]);
      setDownedPoint({ x, y });
    }
    if (tool === "pen") {
      setRestoredCommand(scaledCommands.filter((_, i) => i !== index));
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (
      !svgRef.current ||
      overedPoint === undefined ||
      !originalCommand ||
      !downedPoint
    ) {
      return;
    }

    if (tool === "move") {
      const bounding = svgRef.current.getBoundingClientRect();
      const x = e.clientX - bounding.x;
      const y = e.clientY - bounding.y;
      const diffx = x - downedPoint.x;
      const diffy = y - downedPoint.y;

      const clonedCommand = structuredClone(originalCommand);
      let clonedBeforeCommand: PathCommand | undefined = undefined;
      let clonedAfterCommand: PathCommand | undefined = undefined;

      if (overedPoint.type === "anchor") {
        // current
        if (originalCommand.type !== "Z" && clonedCommand.type !== "Z") {
          clonedCommand.x += diffx;
          clonedCommand.y += diffy;
        }
        if (originalCommand.type === "C" && clonedCommand.type === "C") {
          clonedCommand.x2 += diffx;
          clonedCommand.y2 += diffy;
        }

        // before
        if (originalAfterCommand) {
          clonedAfterCommand = structuredClone(originalAfterCommand);
          if (
            originalAfterCommand.type === "C" &&
            clonedAfterCommand?.type === "C"
          ) {
            clonedAfterCommand.x1 += diffx;
            clonedAfterCommand.y1 += diffy;
          }
        }
      }

      const isCtrl = e.metaKey || e.ctrlKey;

      if (overedPoint.type === "p1") {
        if (originalCommand.type === "C" && clonedCommand.type === "C") {
          clonedCommand.x1 += diffx;
          clonedCommand.y1 += diffy;

          // opposite handle
          if (originalBeforeCommand) {
            if (originalBeforeCommand.type === "C" && !isCtrl) {
              const rad =
                Math.atan2(
                  clonedCommand.y1 - originalBeforeCommand.y,
                  clonedCommand.x1 - originalBeforeCommand.x
                ) + Math.PI;
              const oppositeDistant = getDistance(
                { x: originalBeforeCommand.x, y: originalBeforeCommand.y },
                { x: originalBeforeCommand.x2, y: originalBeforeCommand.y2 }
              );
              clonedBeforeCommand = structuredClone(originalBeforeCommand);
              if (clonedBeforeCommand?.type === "C") {
                clonedBeforeCommand.x2 =
                  clonedBeforeCommand.x + Math.cos(rad) * oppositeDistant;
                clonedBeforeCommand.y2 =
                  clonedBeforeCommand.y + Math.sin(rad) * oppositeDistant;
              }
            }
          }
        }
      }

      if (overedPoint.type === "p2") {
        if (originalCommand.type === "C" && clonedCommand.type === "C") {
          clonedCommand.x2 += diffx;
          clonedCommand.y2 += diffy;

          // opposite handle
          if (originalAfterCommand && !isCtrl) {
            if (originalAfterCommand.type === "C") {
              const rad =
                Math.atan2(
                  clonedCommand.y2 - originalCommand.y,
                  clonedCommand.x2 - originalCommand.x
                ) + Math.PI;
              const oppositeDistant = getDistance(
                { x: originalCommand.x, y: originalCommand.y },
                { x: originalAfterCommand.x1, y: originalAfterCommand.y1 }
              );
              clonedAfterCommand = structuredClone(originalAfterCommand);
              if (clonedAfterCommand?.type === "C") {
                clonedAfterCommand.x1 =
                  originalCommand.x + Math.cos(rad) * oppositeDistant;
                clonedAfterCommand.y1 =
                  originalCommand.y + Math.sin(rad) * oppositeDistant;
              }
            }
          }
        }
      }

      setRestoredCommand(
        scaledCommands.map((command, index) =>
          index === overedPoint.index
            ? clonedCommand
            : index === overedPoint.index + 1 && clonedAfterCommand
            ? clonedAfterCommand
            : index === overedPoint.index - 1 && clonedBeforeCommand
            ? clonedBeforeCommand
            : command
        )
      );
    }
  };

  const onMouseUp = () => {
    setOveredPoint(undefined);
    setOriginalCommand(undefined);
    setOriginalBeforeCommand(undefined);
    setOriginalAfterCommand(undefined);
    setDownedPoint(undefined);
  };

  useEffect(() => {
    setScreenSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <>
      <svg
        width={screenSize.width}
        height={screenSize.height}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        ref={svgRef}
      >
        {editing &&
          curveCircles.map((c, index) => (
            <React.Fragment key={index}>
              <HandleLine x1={c.x} y1={c.y} x2={c.x2} y2={c.y2} />
              {index > 0 &&
                (() => {
                  const afterCurve = scaledCommands[c.index + 1];
                  return afterCurve && afterCurve.type === "C" ? (
                    <HandleLine
                      x1={c.x}
                      y1={c.y}
                      x2={afterCurve.x1}
                      y2={afterCurve.y1}
                    />
                  ) : (
                    <></>
                  );
                })()}
            </React.Fragment>
          ))}
        <Path d={pathD.join(" ")} editing={editing} />
        {editing && (
          <>
            {curveCircles.map((c, index) => (
              <React.Fragment key={index}>
                <Circle cx={c.x1} cy={c.y1} r={radius} />
                <Circle cx={c.x2} cy={c.y2} r={radius} />
              </React.Fragment>
            ))}
            {circles.map((c) => (
              <Rect
                x={c.x - radius}
                y={c.y - radius}
                width={radius * 2}
                height={radius * 2}
                stroke="#000"
                key={c.index}
              />
            ))}
          </>
        )}
      </svg>
    </>
  );
};

export default BezierEditor;
