import type { DiagramConnector, DiagramShape } from "@diagrammer/shared";
import { ConnectorElement } from "./ConnectorElement.js";

interface ConnectorLayerProps {
  connectors: DiagramConnector[];
  shapes: DiagramShape[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConnectorLayer({ connectors, shapes, selectedId, onSelect }: ConnectorLayerProps) {
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
            isSelected={connector.id === selectedId}
            onSelect={onSelect}
          />
        );
      })}
    </g>
  );
}
