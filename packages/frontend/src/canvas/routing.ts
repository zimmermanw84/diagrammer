import type { DiagramConnector } from "@diagrammer/shared";
import type { Point } from "./geometry.js";

export function buildPath(
  from: Point,
  to: Point,
  routing: DiagramConnector["routing"],
  midX: number
): string {
  switch (routing) {
    case "straight":
      return `M ${from.x},${from.y} L ${to.x},${to.y}`;
    case "right_angle":
      return `M ${from.x},${from.y} L ${midX},${from.y} L ${midX},${to.y} L ${to.x},${to.y}`;
    case "curved": {
      const dy = (to.y - from.y) / 2;
      return `M ${from.x},${from.y} C ${from.x},${from.y + dy} ${to.x},${to.y - dy} ${to.x},${to.y}`;
    }
  }
}
