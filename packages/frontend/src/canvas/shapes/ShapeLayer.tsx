import type { DiagramShape } from "@diagrammer/shared";
import { ShapeElement } from "./ShapeElement.js";
import type { ConnectionPoint } from "./ConnectionHandles.js";

interface ShapeLayerProps {
  shapes: DiagramShape[];
  selectedIds: string[];
  onSelect: (id: string, multi?: boolean) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onLabelChange: (id: string, label: string) => void;
  onStartConnect: (shapeId: string, point: ConnectionPoint) => void;
}

export function ShapeLayer({ shapes, selectedIds, onSelect, onMove, onLabelChange, onStartConnect }: ShapeLayerProps) {
  return (
    <g data-layer="shapes">
      {shapes.map((shape) => (
        <ShapeElement
          key={shape.id}
          shape={shape}
          isSelected={selectedIds.includes(shape.id)}
          onSelect={onSelect}
          onMove={onMove}
          onLabelChange={onLabelChange}
          onStartConnect={onStartConnect}
        />
      ))}
    </g>
  );
}
