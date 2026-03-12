import type { ShapeStyle } from "@diagrammer/shared";

const DASH_ARRAYS: Record<ShapeStyle["strokeDash"], string> = {
  solid: "none",
  dashed: "8 4",
  dotted: "2 4",
};

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
