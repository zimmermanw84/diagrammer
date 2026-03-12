import type { DiagramShape } from "@diagrammer/shared";
import { ShapeElement } from "./ShapeElement.js";

interface ShapeLayerProps {
  shapes: DiagramShape[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onLabelChange: (id: string, label: string) => void;
}

export function ShapeLayer({ shapes, selectedId, onSelect, onMove, onLabelChange }: ShapeLayerProps) {
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
        />
      ))}
    </g>
  );
}
