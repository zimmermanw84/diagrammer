import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ConnectorLayer } from "./ConnectorLayer.js";
import { makeShape, makeConnector } from "../../test-utils/fixtures.js";

describe("ConnectorLayer", () => {
  it("renders nothing when there are no connectors", () => {
    const { container } = render(<svg><ConnectorLayer connectors={[]} shapes={[]} selectedIds={[]} onSelect={vi.fn()} /></svg>);
    expect(container.querySelectorAll("[data-connector]")).toHaveLength(0);
  });

  it("renders one connector between two shapes", () => {
    const shapes = [makeShape({ id: "s1" }), makeShape({ id: "s2" })];
    const connectors = [makeConnector({ id: "c1", fromShapeId: "s1", toShapeId: "s2" })];
    const { container } = render(<svg><ConnectorLayer connectors={connectors} shapes={shapes} selectedIds={[]} onSelect={vi.fn()} /></svg>);
    expect(container.querySelectorAll("[data-connector]")).toHaveLength(1);
  });

  it("skips connectors where fromShape is missing", () => {
    const shapes = [makeShape({ id: "s2" })];
    const connectors = [makeConnector({ id: "c1", fromShapeId: "missing", toShapeId: "s2" })];
    const { container } = render(<svg><ConnectorLayer connectors={connectors} shapes={shapes} selectedIds={[]} onSelect={vi.fn()} /></svg>);
    expect(container.querySelectorAll("[data-connector]")).toHaveLength(0);
  });

  it("skips connectors where toShape is missing", () => {
    const shapes = [makeShape({ id: "s1" })];
    const connectors = [makeConnector({ id: "c1", fromShapeId: "s1", toShapeId: "missing" })];
    const { container } = render(<svg><ConnectorLayer connectors={connectors} shapes={shapes} selectedIds={[]} onSelect={vi.fn()} /></svg>);
    expect(container.querySelectorAll("[data-connector]")).toHaveLength(0);
  });

  it("renders multiple valid connectors", () => {
    const shapes = [makeShape({ id: "s1" }), makeShape({ id: "s2" }), makeShape({ id: "s3" })];
    const connectors = [
      makeConnector({ id: "c1", fromShapeId: "s1", toShapeId: "s2" }),
      makeConnector({ id: "c2", fromShapeId: "s2", toShapeId: "s3" }),
    ];
    const { container } = render(<svg><ConnectorLayer connectors={connectors} shapes={shapes} selectedIds={[]} onSelect={vi.fn()} /></svg>);
    expect(container.querySelectorAll("[data-connector]")).toHaveLength(2);
  });
});
