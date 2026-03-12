import { useState, useEffect } from "react";
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
  useEffect(() => {
    if (!inProgress) return;

    const onMouseMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - transform.x) / transform.scale;
      const svgY = (e.clientY - rect.top - transform.y) / transform.scale;
      setInProgress({ ...inProgress, toPoint: { x: svgX, y: svgY } });
    };

    const onMouseUp = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - transform.x) / transform.scale;
      const svgY = (e.clientY - rect.top - transform.y) / transform.scale;
      const inchX = toInches(svgX);
      const inchY = toInches(svgY);

      // Find shape under cursor
      const target = shapes.find(
        (s) =>
          s.id !== inProgress.fromShapeId &&
          inchX >= s.x && inchX <= s.x + s.width &&
          inchY >= s.y && inchY <= s.y + s.height
      );

      if (target) onConnect(inProgress.fromShapeId, target.id);
      setInProgress(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [inProgress, shapes, svgRef, transform, onConnect, setInProgress]);

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
