import { useRef, useEffect } from "react";
import type { DiagramShape } from "@diagrammer/shared";
import { DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";
import { toPixels, toInches, clientToSvgCoords } from "./units.js";
import { useGlobalMouseDrag } from "./useGlobalMouseDrag.js";
import type { ConnectionPoint } from "./shapes/ConnectionHandles.js";

interface InProgress {
  fromShapeId: string;
  fromPoint: { x: number; y: number }; // SVG coords (pixels, absolute on page)
  toPoint: { x: number; y: number };
}

interface ConnectorDrawingProps {
  shapes: DiagramShape[];
  svgRef: React.RefObject<SVGSVGElement | null>;
  transform: { scale: number; x: number; y: number };
  onConnect: (fromShapeId: string, toShapeId: string) => void;
  // Called by ShapeLayer to start a connection
  inProgress: InProgress | null;
  setInProgress: (v: InProgress | null) => void;
}

export function ConnectorDrawing({ shapes, svgRef, transform, onConnect, inProgress, setInProgress }: ConnectorDrawingProps) {
  // Refs keep callbacks current without re-registering listeners
  const inProgressRef = useRef(inProgress);
  const shapesRef = useRef(shapes);
  const transformRef = useRef(transform);
  const onConnectRef = useRef(onConnect);
  const setInProgressRef = useRef(setInProgress);

  inProgressRef.current = inProgress;
  shapesRef.current = shapes;
  transformRef.current = transform;
  onConnectRef.current = onConnect;
  setInProgressRef.current = setInProgress;

  const startDrag = useGlobalMouseDrag();
  const isDraggingRef = useRef(false);

  // Start a drag session whenever a new connection begins (inProgress: null → non-null).
  // Guard with isDraggingRef so intermediate toPoint updates don't re-register listeners.
  useEffect(() => {
    if (!inProgress || isDraggingRef.current) return;
    isDraggingRef.current = true;

    startDrag(
      (e) => {
        const svg = svgRef.current;
        if (!svg || !inProgressRef.current) return;
        const t = transformRef.current;
        const { x: svgX, y: svgY } = clientToSvgCoords(e.clientX, e.clientY, svg.getBoundingClientRect(), t);
        setInProgressRef.current({ ...inProgressRef.current, toPoint: { x: svgX, y: svgY } });
      },
      (e) => {
        isDraggingRef.current = false;
        const ip = inProgressRef.current;
        if (!ip) return;
        const svg = svgRef.current;
        if (!svg) return;
        const t = transformRef.current;
        const { x: svgX, y: svgY } = clientToSvgCoords(e.clientX, e.clientY, svg.getBoundingClientRect(), t);
        const inchX = toInches(svgX);
        const inchY = toInches(svgY);

        const target = shapesRef.current.find(
          (s) =>
            s.id !== ip.fromShapeId &&
            inchX >= s.x && inchX <= s.x + s.width &&
            inchY >= s.y && inchY <= s.y + s.height
        );

        if (target) onConnectRef.current(ip.fromShapeId, target.id);
        setInProgressRef.current(null);
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress]); // re-runs on each toPoint update; isDraggingRef guard prevents double-register

  if (!inProgress) return null;

  const { fromPoint, toPoint } = inProgress;
  return (
    <line
      x1={fromPoint.x}
      y1={fromPoint.y}
      x2={toPoint.x}
      y2={toPoint.y}
      stroke="#4f8ef7"
      strokeWidth={1.5}
      strokeDasharray="6 3"
      style={{ pointerEvents: "none" }}
    />
  );
}

// Helper: convert a ConnectionPoint (relative to shape origin) to absolute SVG coords
export function resolveConnectionPoint(shape: DiagramShape, point: ConnectionPoint) {
  return {
    x: toPixels(shape.x) + point.x,
    y: toPixels(shape.y) + point.y,
  };
}

export type { InProgress };

// Re-export default style for convenience
export { DEFAULT_CONNECTOR_STYLE };
