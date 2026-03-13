import type { DiagramConnector, DiagramShape, ArrowHeadType } from "@diagrammer/shared";
import { toPixels } from "../units.js";
import { DASH_ARRAYS } from "../canvasConstants.js";

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

function buildPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  routing: DiagramConnector["routing"]
): string {
  switch (routing) {
    case "straight":
      return `M ${from.x},${from.y} L ${to.x},${to.y}`;
    case "right_angle": {
      const midX = (from.x + to.x) / 2;
      return `M ${from.x},${from.y} L ${midX},${from.y} L ${midX},${to.y} L ${to.x},${to.y}`;
    }
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
      {/* crowsfoot */}
      <marker id={markerId("crowsfoot", connectorId)} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE} refX={9} refY={5} orient="auto">
        <polyline points="1,1 9,5 1,9" fill="none" stroke={strokeColor} strokeWidth={1.5} />
        <line x1={1} y1={5} x2={9} y2={5} stroke={strokeColor} strokeWidth={1.5} />
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
  const from = center(fromShape);
  const to = center(toShape);
  const d = buildPath(from, to, connector.routing);

  const { strokeColor, strokeWidth, strokeDash, arrowStart, arrowEnd } = connector.style;
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <g data-connector={connector.id} onClick={() => onSelect(connector.id)}>
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
          fill="#333"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {connector.label}
        </text>
      )}
    </g>
  );
}
