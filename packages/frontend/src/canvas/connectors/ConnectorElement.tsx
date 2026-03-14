import type { DiagramConnector, DiagramShape, ArrowHeadType } from "@diagrammer/shared";
import { toPixels } from "../units.js";
import { DASH_ARRAYS } from "../canvasConstants.js";
import { THEME } from "../../theme.js";

interface ConnectorElementProps {
  connector: DiagramConnector;
  fromShape: DiagramShape;
  toShape: DiagramShape;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

// Center of a shape in pixels
function center(shape: DiagramShape) {
  return {
    x: toPixels(shape.x + shape.width / 2),
    y: toPixels(shape.y + shape.height / 2),
  };
}

type Point = { x: number; y: number };

/**
 * Find where a ray from (cx, cy) toward (towardX, towardY) first exits a
 * convex polygon defined by `vertices` (in order). Returns the intersection
 * point, or the center if none is found (degenerate case).
 */
function rayPolygonEdge(
  cx: number, cy: number,
  towardX: number, towardY: number,
  vertices: Point[]
): Point {
  const dx = towardX - cx;
  const dy = towardY - cy;
  let bestT = Infinity;
  let best: Point = { x: cx, y: cy };

  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % vertices.length]!;
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const cross = dx * aby - dy * abx;
    if (Math.abs(cross) < 0.0001) continue; // parallel
    const t = ((a.x - cx) * aby - (a.y - cy) * abx) / cross;
    const s = ((a.x - cx) * dy - (a.y - cy) * dx) / cross;
    if (t > 0.0001 && s >= -0.0001 && s <= 1.0001 && t < bestT) {
      bestT = t;
      best = { x: cx + dx * t, y: cy + dy * t };
    }
  }
  return best;
}

/**
 * Returns the point on the shape's actual visual border where a ray from the
 * shape center toward (towardX, towardY) exits — accounting for shape type.
 */
function shapeEdgePoint(
  shape: DiagramShape,
  towardX: number,
  towardY: number
): Point {
  const cx = toPixels(shape.x + shape.width / 2);
  const cy = toPixels(shape.y + shape.height / 2);
  const hw = toPixels(shape.width / 2);
  const hh = toPixels(shape.height / 2);
  const dx = towardX - cx;
  const dy = towardY - cy;

  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: cx, y: cy };

  switch (shape.type) {
    case "ellipse": {
      // Closed-form: point on ellipse at the angle toward target
      const angle = Math.atan2(dy, dx);
      return { x: cx + hw * Math.cos(angle), y: cy + hh * Math.sin(angle) };
    }

    case "diamond":
      return rayPolygonEdge(cx, cy, towardX, towardY, [
        { x: cx,      y: cy - hh },
        { x: cx + hw, y: cy      },
        { x: cx,      y: cy + hh },
        { x: cx - hw, y: cy      },
      ]);

    case "triangle":
      return rayPolygonEdge(cx, cy, towardX, towardY, [
        { x: cx,      y: cy - hh },
        { x: cx + hw, y: cy + hh },
        { x: cx - hw, y: cy + hh },
      ]);

    case "parallelogram": {
      // offset = shape.width * 0.2 in pixels = hw * 0.4
      const off = hw * 0.4;
      return rayPolygonEdge(cx, cy, towardX, towardY, [
        { x: cx - hw + off, y: cy - hh },
        { x: cx + hw,       y: cy - hh },
        { x: cx + hw - off, y: cy + hh },
        { x: cx - hw,       y: cy + hh },
      ]);
    }

    default:
      // rectangle, rounded_rectangle, image — bounding box intersection
      const tx = Math.abs(dx) > 0.001 ? hw / Math.abs(dx) : Infinity;
      const ty = Math.abs(dy) > 0.001 ? hh / Math.abs(dy) : Infinity;
      return { x: cx + dx * Math.min(tx, ty), y: cy + dy * Math.min(tx, ty) };
  }
}

function buildPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
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

const MARKER_SIZE = 10;

function markerId(type: ArrowHeadType, connectorId: string) {
  return `marker-${type}-${connectorId}`;
}

function ArrowMarkers({ connectorId, strokeColor }: { connectorId: string; strokeColor: string }) {
  return (
    <defs>
      {/* open chevron */}
      <marker id={markerId("open", connectorId)} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE} refX={9} refY={5} orient="auto">
        <polyline points="1,1 9,5 1,9" fill="none" stroke={strokeColor} strokeWidth={1.5} />
      </marker>
      {/* filled triangle */}
      <marker id={markerId("filled", connectorId)} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE} refX={9} refY={5} orient="auto">
        <polygon points="1,1 9,5 1,9" fill={strokeColor} />
      </marker>
      {/* crowsfoot: three lines radiating from a single tip point */}
      <marker id={markerId("crowsfoot", connectorId)} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE} refX={9} refY={5} orient="auto">
        <line x1={1} y1={1} x2={9} y2={5} stroke={strokeColor} strokeWidth={1.5} />
        <line x1={1} y1={5} x2={9} y2={5} stroke={strokeColor} strokeWidth={1.5} />
        <line x1={1} y1={9} x2={9} y2={5} stroke={strokeColor} strokeWidth={1.5} />
      </marker>
      {/* one (perpendicular line) */}
      <marker id={markerId("one", connectorId)} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE} refX={5} refY={5} orient="auto">
        <line x1={5} y1={1} x2={5} y2={9} stroke={strokeColor} strokeWidth={1.5} />
      </marker>
    </defs>
  );
}

function markerUrl(type: ArrowHeadType, connectorId: string): string | undefined {
  if (type === "none") return undefined;
  return `url(#${markerId(type, connectorId)})`;
}

export function ConnectorElement({ connector, fromShape, toShape, isSelected, onSelect }: ConnectorElementProps) {
  const fromCenter = center(fromShape);
  const toCenter = center(toShape);

  // Path endpoints at shape borders so arrowheads aren't hidden inside shapes
  const from = shapeEdgePoint(fromShape, toCenter.x, toCenter.y);
  const to = shapeEdgePoint(toShape, fromCenter.x, fromCenter.y);

  // Midpoint of the center-to-center line (for right_angle elbow + label)
  const midX = (fromCenter.x + toCenter.x) / 2;
  const midY = (fromCenter.y + toCenter.y) / 2;

  const d = buildPath(from, to, connector.routing, midX);
  const { strokeColor, strokeWidth, strokeDash, arrowStart, arrowEnd } = connector.style;

  return (
    <g data-connector={connector.id} onClick={(e) => { e.stopPropagation(); onSelect(connector.id); }}>
      <ArrowMarkers connectorId={connector.id} strokeColor={strokeColor} />

      {/* invisible wide hit area */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={12} style={{ cursor: "pointer" }} />

      {/* visible path */}
      <path
        d={d}
        fill="none"
        stroke={isSelected ? "#4f8ef7" : strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={DASH_ARRAYS[strokeDash] ?? "none"}
        markerStart={markerUrl(arrowStart, connector.id)}
        markerEnd={markerUrl(arrowEnd, connector.id)}
      />

      {/* selection highlight */}
      {isSelected && (
        <path d={d} fill="none" stroke="#4f8ef7" strokeWidth={strokeWidth + 2} strokeOpacity={0.3} />
      )}

      {/* label */}
      {connector.label && (
        <text
          x={midX}
          y={midY - 6}
          textAnchor="middle"
          fontSize={12}
          fill={THEME.text}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {connector.label}
        </text>
      )}
    </g>
  );
}

export { shapeEdgePoint };
