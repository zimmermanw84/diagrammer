import type { DiagramConnector, DiagramShape, ArrowHeadType } from "@diagrammer/shared";
import { DASH_ARRAYS } from "../canvasConstants.js";
import { THEME } from "../../theme.js";
import { shapeCenter, shapeEdgePoint } from "../geometry.js";
import { buildPath } from "../routing.js";

interface ConnectorElementProps {
  connector: DiagramConnector;
  fromShape: DiagramShape;
  toShape: DiagramShape;
  isSelected: boolean;
  onSelect: (id: string) => void;
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
  const fromCenter = shapeCenter(fromShape);
  const toCenter = shapeCenter(toShape);

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
