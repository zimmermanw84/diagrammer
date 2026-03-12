import type { DiagramShape } from "@diagrammer/shared";
import { ShapeElement } from "./ShapeElement.js";
import type { ConnectionPoint } from "./ConnectionHandles.js";

interface ShapeLayerProps {
  shapes: DiagramShape[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onLabelChange: (id: string, label: string) => void;
  onStartConnect: (shapeId: string, point: ConnectionPoint) => void;
}

export function ShapeLayer({ shapes, selectedId, onSelect, onMove, onLabelChange, onStartConnect }: ShapeLayerProps) {
  return (
    <g data-layer="shapes">
      {shapes.map((shape) => (
        <ShapeElement
          key={shape.id}
          shape={shape}
          isSelected={shape.id === selectedId}
          onSelect={onSelect}
          onMove={onMove}
          onLabelChange={onLabelChange}
          onStartConnect={onStartConnect}
        />
      ))}
    </g>
  );
}
