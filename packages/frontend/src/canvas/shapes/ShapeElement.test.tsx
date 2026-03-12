import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShapeElement } from "./ShapeElement.js";
import { DEFAULT_SHAPE_STYLE } from "@diagrammer/shared";
import type { DiagramShape } from "@diagrammer/shared";

function makeShape(overrides: Partial<DiagramShape> = {}): DiagramShape {
  return {
    id: "shape-1",
    type: "rectangle",
    x: 1,
    y: 1,
    width: 2,
    height: 1,
    label: "Box",
    style: { ...DEFAULT_SHAPE_STYLE },
    properties: {},
    ...overrides,
  };
}

function renderShape(props: Partial<Parameters<typeof ShapeElement>[0]> = {}) {
  const defaults = {
    shape: makeShape(),
    isSelected: false,
    onSelect: vi.fn(),
    onMove: vi.fn(),
    onLabelChange: vi.fn(),
  };
  return render(<svg><ShapeElement {...defaults} {...props} /></svg>);
}

describe("ShapeElement", () => {
  it("renders the shape label", () => {
    renderShape({ shape: makeShape({ label: "Hello" }) });
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("calls onSelect on mousedown", () => {
    const onSelect = vi.fn();
    const { container } = renderShape({ onSelect });
    fireEvent.mouseDown(container.querySelector("g")!);
    expect(onSelect).toHaveBeenCalledWith("shape-1");
  });

  it("renders the shape geometry when isSelected", () => {
    const { container } = renderShape({ isSelected: true });
    // Selection ring is now handled by SelectionOverlay, not ShapeElement
    expect(container.querySelector("rect")).toBeTruthy();
  });

  it("enters edit mode on double-click and shows input", () => {
    const { container } = renderShape();
    fireEvent.doubleClick(container.querySelector("g")!);
    expect(container.querySelector("input")).toBeTruthy();
  });

  it("commits label on blur", () => {
    const onLabelChange = vi.fn();
    const { container } = renderShape({ onLabelChange });
    fireEvent.doubleClick(container.querySelector("g")!);
    const input = container.querySelector("input")!;
    fireEvent.change(input, { target: { value: "New Label" } });
    fireEvent.blur(input);
    expect(onLabelChange).toHaveBeenCalledWith("shape-1", "New Label");
  });

  it("commits label on Enter key", () => {
    const onLabelChange = vi.fn();
    const { container } = renderShape({ onLabelChange });
    fireEvent.doubleClick(container.querySelector("g")!);
    const input = container.querySelector("input")!;
    fireEvent.change(input, { target: { value: "Enter Label" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onLabelChange).toHaveBeenCalledWith("shape-1", "Enter Label");
  });

  it("cancels edit on Escape key", () => {
    const onLabelChange = vi.fn();
    const { container } = renderShape({ onLabelChange });
    fireEvent.doubleClick(container.querySelector("g")!);
    const input = container.querySelector("input")!;
    fireEvent.change(input, { target: { value: "Discard" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onLabelChange).not.toHaveBeenCalled();
    expect(container.querySelector("input")).toBeNull();
  });

  it("does not render label text when label is empty", () => {
    const { container } = renderShape({ shape: makeShape({ label: "" }) });
    expect(container.querySelector("text")).toBeNull();
  });
});
