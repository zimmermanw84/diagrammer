import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ConnectorLayer } from "./ConnectorLayer.js";
import { DEFAULT_CONNECTOR_STYLE, DEFAULT_SHAPE_STYLE } from "@diagrammer/shared";
import type { DiagramShape, DiagramConnector } from "@diagrammer/shared";

function makeShape(id: string): DiagramShape {
  return { id, type: "rectangle", x: 0, y: 0, width: 2, height: 1, label: "", style: { ...DEFAULT_SHAPE_STYLE }, properties: {} };
}

function makeConnector(id: string, from: string, to: string): DiagramConnector {
  return { id, fromShapeId: from, toShapeId: to, label: "", style: { ...DEFAULT_CONNECTOR_STYLE }, routing: "straight" };
}

describe("ConnectorLayer", () => {
  it("renders nothing when there are no connectors", () => {
    const { container } = render(<svg><ConnectorLayer connectors={[]} shapes={[]} selectedId={null} onSelect={vi.fn()} /></svg>);
    expect(container.querySelectorAll("[data-connector]")).toHaveLength(0);
  });

  it("renders one connector between two shapes", () => {
    const shapes = [makeShape("s1"), makeShape("s2")];
    const connectors = [makeConnector("c1", "s1", "s2")];
    const { container } = render(<svg><ConnectorLayer connectors={connectors} shapes={shapes} selectedId={null} onSelect={vi.fn()} /></svg>);
    expect(container.querySelectorAll("[data-connector]")).toHaveLength(1);
  });

  it("skips connectors where fromShape is missing", () => {
    const shapes = [makeShape("s2")];
    const connectors = [makeConnector("c1", "missing", "s2")];
    const { container } = render(<svg><ConnectorLayer connectors={connectors} shapes={shapes} selectedId={null} onSelect={vi.fn()} /></svg>);
    expect(container.querySelectorAll("[data-connector]")).toHaveLength(0);
  });

  it("skips connectors where toShape is missing", () => {
    const shapes = [makeShape("s1")];
    const connectors = [makeConnector("c1", "s1", "missing")];
    const { container } = render(<svg><ConnectorLayer connectors={connectors} shapes={shapes} selectedId={null} onSelect={vi.fn()} /></svg>);
    expect(container.querySelectorAll("[data-connector]")).toHaveLength(0);
  });

  it("renders multiple valid connectors", () => {
    const shapes = [makeShape("s1"), makeShape("s2"), makeShape("s3")];
    const connectors = [makeConnector("c1", "s1", "s2"), makeConnector("c2", "s2", "s3")];
    const { container } = render(<svg><ConnectorLayer connectors={connectors} shapes={shapes} selectedId={null} onSelect={vi.fn()} /></svg>);
    expect(container.querySelectorAll("[data-connector]")).toHaveLength(2);
  });
});
