import type { DiagramConnector, DiagramShape } from "@diagrammer/shared";
import { ConnectorElement } from "./ConnectorElement.js";

interface ConnectorLayerProps {
  connectors: DiagramConnector[];
  shapes: DiagramShape[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}

export function ConnectorLayer({ connectors, shapes, selectedIds, onSelect }: ConnectorLayerProps) {
  const shapeMap = new Map(shapes.map((s) => [s.id, s]));

  return (
    <g data-layer="connectors">
      {connectors.map((connector) => {
        const from = shapeMap.get(connector.fromShapeId);
        const to = shapeMap.get(connector.toShapeId);
        if (!from || !to) return null;
        return (
          <ConnectorElement
            key={connector.id}
            connector={connector}
            fromShape={from}
            toShape={to}
            isSelected={selectedIds.includes(connector.id)}
            onSelect={onSelect}
          />
        );
      })}
    </g>
  );
}
