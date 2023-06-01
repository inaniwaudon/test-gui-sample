import { PathCommand } from "opentype.js";
import { Point } from "./figure";

export type PointType = "anchor" | "p1" | "p2";

export const scaleCommands = (
  commands: PathCommand[],
  unitsPerEm: number,
  size: number,
  offset: Point
) => {
  const scaleX = (x: number) => (x / unitsPerEm) * size + offset.x;
  const scaleY = (y: number) => (y / unitsPerEm) * size + offset.y;

  const newCommands: PathCommand[] = structuredClone(commands);
  newCommands.forEach((c) => {
    if (c.type !== "Z") {
      c.x = scaleX(c.x);
      c.y = scaleY(c.y);
    }
    if (c.type === "C") {
      c.x1 = scaleX(c.x1);
      c.y1 = scaleY(c.y1);
      c.x2 = scaleX(c.x2);
      c.y2 = scaleY(c.y2);
    }
  });
  return newCommands;
};

export const rescaleCommands = (
  commands: PathCommand[],
  unitsPerEm: number,
  size: number,
  offset: Point
) => {
  const rescaleX = (x: number) =>
    Math.round(((x - offset.x) / size) * unitsPerEm);
  const rescaleY = (y: number) =>
    Math.round(((y - offset.y) / size) * unitsPerEm);

  const newCommands: PathCommand[] = structuredClone(commands);
  newCommands.forEach((c) => {
    if (c.type !== "Z") {
      c.x = rescaleX(c.x);
      c.y = rescaleY(c.y);
    }
    if (c.type === "C") {
      c.x1 = rescaleX(c.x1);
      c.y1 = rescaleY(c.y1);
      c.x2 = rescaleX(c.x2);
      c.y2 = rescaleY(c.y2);
    }
  });
  return newCommands;
};

export const commandsToPathD = (commands: PathCommand[]) =>
  commands.map((command) => {
    switch (command.type) {
      case "M":
        return `M ${command.x} ${command.y}`;
      case "L":
        return `L ${command.x} ${command.y}`;
      case "C":
        return `C ${command.x1} ${command.y1} ${command.x2} ${command.y2} ${command.x} ${command.y}`;
      case "Q":
        return `Q ${command.x1} ${command.y1} ${command.x} ${command.y}`;
      case "Z":
        return "Z";
    }
  });
