import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ConnectorElement } from "./ConnectorElement.js";
import { DEFAULT_CONNECTOR_STYLE, DEFAULT_SHAPE_STYLE } from "@diagrammer/shared";
import type { DiagramShape, DiagramConnector, RoutingAlgorithm, ArrowHeadType } from "@diagrammer/shared";

function makeShape(id: string, x = 0, y = 0): DiagramShape {
  return { id, type: "rectangle", x, y, width: 2, height: 1, label: "", style: { ...DEFAULT_SHAPE_STYLE }, properties: {} };
}

function makeConnector(overrides: Partial<DiagramConnector> = {}): DiagramConnector {
  return {
    id: "c1",
    fromShapeId: "s1",
    toShapeId: "s2",
    label: "",
    style: { ...DEFAULT_CONNECTOR_STYLE },
    routing: "straight",
    ...overrides,
  };
}

function renderConnector(props: Partial<Parameters<typeof ConnectorElement>[0]> = {}) {
  const defaults = {
    connector: makeConnector(),
    fromShape: makeShape("s1", 0, 0),
    toShape: makeShape("s2", 3, 0),
    isSelected: false,
    onSelect: vi.fn(),
  };
  return render(<svg><ConnectorElement {...defaults} {...props} /></svg>);
}

describe("ConnectorElement", () => {
  it("renders a path element", () => {
    const { container } = renderConnector();
    expect(container.querySelector("path")).toBeTruthy();
  });

  const routings: RoutingAlgorithm[] = ["straight", "right_angle", "curved"];
  it.each(routings)("renders without error for routing: %s", (routing) => {
    expect(() => renderConnector({ connector: makeConnector({ routing }) })).not.toThrow();
  });

  const arrowHeads: ArrowHeadType[] = ["none", "open", "filled", "crowsfoot", "one"];
  it.each(arrowHeads)("renders without error for arrowEnd: %s", (arrowEnd) => {
    const style = { ...DEFAULT_CONNECTOR_STYLE, arrowEnd };
    expect(() => renderConnector({ connector: makeConnector({ style }) })).not.toThrow();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    const { container } = renderConnector({ onSelect });
    fireEvent.click(container.querySelector("g")!);
    expect(onSelect).toHaveBeenCalledWith("c1");
  });

  it("renders label text when label is set", () => {
    const { getByText } = renderConnector({ connector: makeConnector({ label: "my label" }) });
    expect(getByText("my label")).toBeTruthy();
  });

  it("does not render label when label is empty", () => {
    const { container } = renderConnector({ connector: makeConnector({ label: "" }) });
    expect(container.querySelector("text")).toBeNull();
  });

  it("renders selection highlight when isSelected", () => {
    const { container } = renderConnector({ isSelected: true });
    const paths = container.querySelectorAll("path");
    // hit area + visible + selection highlight = 3
    expect(paths.length).toBeGreaterThanOrEqual(3);
  });
});
