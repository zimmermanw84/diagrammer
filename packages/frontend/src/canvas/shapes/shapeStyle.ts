import type { ShapeStyle } from "@diagrammer/shared";
import { DASH_ARRAYS } from "../canvasConstants.js";

/** Maps a DiagramShape ShapeStyle to SVG presentation attributes. */
export function toSvgStyle(style: ShapeStyle): React.SVGAttributes<SVGElement> {
  return {
    fill: style.fillColor,
    stroke: style.strokeColor,
    strokeWidth: style.strokeWidth,
    strokeDasharray: DASH_ARRAYS[style.strokeDash],
    filter: style.shadow ? "url(#shape-shadow)" : undefined,
  };
}
