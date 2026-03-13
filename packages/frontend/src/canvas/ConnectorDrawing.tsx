import { useRef, useEffect } from "react";
import type { DiagramShape } from "@diagrammer/shared";
import { DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";
import { toPixels, toInches } from "./units.js";
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
  // Use refs so stable listeners always read current values without re-registering
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

  // Register listeners once; use refs to read current values on each event
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!inProgressRef.current) return;
      const svg = svgRef.current;
      if (!svg) return;
      const t = transformRef.current;
      const rect = svg.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - t.x) / t.scale;
      const svgY = (e.clientY - rect.top - t.y) / t.scale;
      setInProgressRef.current({ ...inProgressRef.current, toPoint: { x: svgX, y: svgY } });
    };

    const onMouseUp = (e: MouseEvent) => {
      const ip = inProgressRef.current;
      if (!ip) return;
      const svg = svgRef.current;
      if (!svg) return;
      const t = transformRef.current;
      const rect = svg.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - t.x) / t.scale;
      const svgY = (e.clientY - rect.top - t.y) / t.scale;
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
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // register once on mount, refs keep values current

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
