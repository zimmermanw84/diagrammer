import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { SelectionOverlay } from "./SelectionOverlay.js";
import { DEFAULT_SHAPE_STYLE } from "@diagrammer/shared";
import type { DiagramShape } from "@diagrammer/shared";

function makeShape(overrides: Partial<DiagramShape> = {}): DiagramShape {
  return {
    id: "s1", type: "rectangle", x: 1, y: 1, width: 2, height: 1,
    label: "", style: { ...DEFAULT_SHAPE_STYLE }, properties: {}, ...overrides,
  };
}

describe("SelectionOverlay", () => {
  it("renders a bounding box rect", () => {
    const { container } = render(
      <svg><SelectionOverlay shape={makeShape()} onResize={vi.fn()} /></svg>
    );
    const overlay = container.querySelector("[data-selection-overlay]");
    expect(overlay).toBeTruthy();
    expect(overlay?.querySelector("rect")).toBeTruthy();
  });

  it("renders exactly 8 resize handles", () => {
    const { container } = render(
      <svg><SelectionOverlay shape={makeShape()} onResize={vi.fn()} /></svg>
    );
    const rects = container.querySelectorAll("[data-selection-overlay] rect");
    // 1 bounding box + 8 handles = 9 rects
    expect(rects.length).toBe(9);
  });

  it("renders at the correct SVG position", () => {
    const { container } = render(
      <svg><SelectionOverlay shape={makeShape({ x: 1, y: 2 })} onResize={vi.fn()} /></svg>
    );
    const g = container.querySelector("[data-selection-overlay]");
    // x=1in * 96ppi = 96, y=2in * 96ppi = 192
    expect(g?.getAttribute("transform")).toBe("translate(96, 192)");
  });
});
