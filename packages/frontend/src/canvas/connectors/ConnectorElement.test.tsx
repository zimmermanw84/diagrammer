import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ConnectorElement, shapeEdgePoint } from "./ConnectorElement.js";
import { DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";
import type { RoutingAlgorithm, ArrowHeadType } from "@diagrammer/shared";
import { makeShape, makeConnector } from "../../test-utils/fixtures.js";

function renderConnector(props: Partial<Parameters<typeof ConnectorElement>[0]> = {}) {
  const defaults = {
    connector: makeConnector(),
    fromShape: makeShape({ id: "s1", x: 0, y: 0 }),
    toShape: makeShape({ id: "s2", x: 3, y: 0 }),
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

  it("click does not propagate to parent (prevents canvas deselect)", () => {
    const parentClick = vi.fn();
    const { container } = render(
      <svg onClick={parentClick}>
        <ConnectorElement
          connector={makeConnector()}
          fromShape={makeShape({ id: "s1", x: 0, y: 0 })}
          toShape={makeShape({ id: "s2", x: 3, y: 0 })}
          isSelected={false}
          onSelect={vi.fn()}
        />
      </svg>
    );
    fireEvent.click(container.querySelector("g")!);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("renders label text when label is set", () => {
    const { getByText } = renderConnector({ connector: makeConnector({ label: "my label" }) });
    expect(getByText("my label")).toBeTruthy();
  });

  it("does not render label when label is empty", () => {
    const { container } = renderConnector({ connector: makeConnector({ label: "" }) });
    expect(container.querySelector("text")).toBeNull();
  });

  it("path does not start at the shape center (arrowheads are on shape borders)", () => {
    // fromShape center at pixels(1+2/2, 1+1/2) = pixels(2, 1.5)
    // toShape at x=3, so center at pixels(3+2/2, 1+1/2) = pixels(4, 1.5)
    // Path should start at fromShape's RIGHT edge, not its center
    const { container } = renderConnector({
      fromShape: makeShape({ id: "s1", x: 1, y: 1, width: 2, height: 1 }),
      toShape: makeShape({ id: "s2", x: 3, y: 1, width: 2, height: 1 }),
    });
    const paths = container.querySelectorAll("path");
    // The visible path's d attribute should NOT start at center px coords
    const visiblePath = paths[1]!; // [0]=hit area, [1]=visible
    const d = visiblePath.getAttribute("d") ?? "";
    // Center of fromShape = toPixels(2) = 192px; right edge = toPixels(3) = 288px
    // Path should start near 288, not 192
    expect(d).toContain("288");
  });

  it("renders selection highlight when isSelected", () => {
    const { container } = renderConnector({ isSelected: true });
    const paths = container.querySelectorAll("path");
    // hit area + visible + selection highlight = 3
    expect(paths.length).toBeGreaterThanOrEqual(3);
  });

  it("path does not start at the shape center (arrowheads are on shape borders)", () => {
    // fromShape center at pixels(1+2/2, 1+1/2) = pixels(2, 1.5)
    // toShape at x=3, so center at pixels(3+2/2, 1+1/2) = pixels(4, 1.5)
    // Path should start at fromShape's RIGHT edge, not its center
    const { container } = renderConnector({
      fromShape: makeShape({ id: "s1", x: 1, y: 1, width: 2, height: 1 }),
      toShape: makeShape({ id: "s2", x: 3, y: 1, width: 2, height: 1 }),
    });
    const paths = container.querySelectorAll("path");
    // The visible path's d attribute should NOT start at center px coords
    const visiblePath = paths[1]!; // [0]=hit area, [1]=visible
    const d = visiblePath.getAttribute("d") ?? "";
    // Center of fromShape = toPixels(2) = 192px; right edge = toPixels(3) = 288px
    // Path should start near 288, not 192
    expect(d).toContain("288");
  });
});

describe("shapeEdgePoint", () => {
  const PPI = 96;

  it("returns the right edge when approaching from the right", () => {
    // shape: x=0, y=0, width=2, height=2 → center=(1,1)in = (96,96)px, hw=96, hh=96
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2 });
    const pt = shapeEdgePoint(shape, 500, 96); // towardX well to the right, same y as center
    expect(pt.x).toBeCloseTo(2 * PPI); // right edge
    expect(pt.y).toBeCloseTo(1 * PPI); // center y
  });

  it("returns the left edge when approaching from the left", () => {
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2 });
    const pt = shapeEdgePoint(shape, -100, 96);
    expect(pt.x).toBeCloseTo(0);       // left edge
    expect(pt.y).toBeCloseTo(1 * PPI);
  });

  it("returns the top edge when approaching from above", () => {
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2 });
    const pt = shapeEdgePoint(shape, 96, -100);
    expect(pt.x).toBeCloseTo(1 * PPI); // center x
    expect(pt.y).toBeCloseTo(0);       // top edge
  });

  it("returns the bottom edge when approaching from below", () => {
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2 });
    const pt = shapeEdgePoint(shape, 96, 500);
    expect(pt.x).toBeCloseTo(1 * PPI);
    expect(pt.y).toBeCloseTo(2 * PPI); // bottom edge
  });

  it("handles a diagonal approach and hits the correct edge", () => {
    // 2×1 shape: center=(96, 48)px, hw=96, hh=48
    // Approaching from far right, slightly below: tx < ty → right edge hit
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 1 });
    const pt = shapeEdgePoint(shape, 10000, 50); // nearly horizontal
    expect(pt.x).toBeCloseTo(2 * PPI); // right edge
  });

  // ── ellipse ──────────────────────────────────────────────────────────────

  it("ellipse: exit point lies on the ellipse boundary", () => {
    // 2×2 circle: cx=96, cy=96, rx=ry=96
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2, type: "ellipse" });
    const pt = shapeEdgePoint(shape, 500, 96); // approach from right, same y
    const cx = 1 * PPI, cy = 1 * PPI, rx = 1 * PPI, ry = 1 * PPI;
    // Must satisfy ellipse equation ≈ 1
    expect((pt.x - cx) ** 2 / rx ** 2 + (pt.y - cy) ** 2 / ry ** 2).toBeCloseTo(1);
  });

  it("ellipse: exit point is on the right for horizontal approach", () => {
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2, type: "ellipse" });
    const pt = shapeEdgePoint(shape, 5000, 1 * PPI);
    expect(pt.x).toBeCloseTo(2 * PPI); // rightmost point
    expect(pt.y).toBeCloseTo(1 * PPI);
  });

  it("ellipse: exit point is on the top for vertical approach", () => {
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2, type: "ellipse" });
    const pt = shapeEdgePoint(shape, 1 * PPI, -5000);
    expect(pt.x).toBeCloseTo(1 * PPI);
    expect(pt.y).toBeCloseTo(0); // topmost point
  });

  it("ellipse: exit point lies on boundary for a non-square ellipse", () => {
    // 4×2 ellipse: cx=192, cy=96, rx=192, ry=96
    const shape = makeShape({ x: 0, y: 0, width: 4, height: 2, type: "ellipse" });
    const cx = 2 * PPI, cy = 1 * PPI;
    const rx = 2 * PPI, ry = 1 * PPI;
    const pt = shapeEdgePoint(shape, cx + 100, cy + 100); // diagonal
    expect((pt.x - cx) ** 2 / rx ** 2 + (pt.y - cy) ** 2 / ry ** 2).toBeCloseTo(1);
  });

  // ── diamond ──────────────────────────────────────────────────────────────

  it("diamond: exits at the right vertex when approaching from the right", () => {
    // 2×2 diamond: cx=96, cy=96, hw=96, hh=96 → right vertex at (192, 96)
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2, type: "diamond" });
    const pt = shapeEdgePoint(shape, 5000, 1 * PPI);
    expect(pt.x).toBeCloseTo(2 * PPI);
    expect(pt.y).toBeCloseTo(1 * PPI);
  });

  it("diamond: exits at the top vertex when approaching from above", () => {
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2, type: "diamond" });
    const pt = shapeEdgePoint(shape, 1 * PPI, -5000);
    expect(pt.x).toBeCloseTo(1 * PPI);
    expect(pt.y).toBeCloseTo(0);
  });

  it("diamond: exit point is inside the bounding box (not on the bbox edge)", () => {
    // A diagonal approach should NOT land on the bbox corner for a diamond
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2, type: "diamond" });
    // Approach from upper-right at 45°: exits on the top-right edge of the diamond
    const cx = 1 * PPI, cy = 1 * PPI;
    const pt = shapeEdgePoint(shape, cx + 1000, cy - 1000);
    // Should not be at the bbox corner (2*PPI, 0)
    expect(pt.x).toBeLessThan(2 * PPI);
    expect(pt.y).toBeGreaterThan(0);
  });

  // ── triangle ─────────────────────────────────────────────────────────────

  it("triangle: exits at the top vertex when approaching from above", () => {
    // 2×2 triangle: top=(96,0), br=(192,192), bl=(0,192)
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2, type: "triangle" });
    const pt = shapeEdgePoint(shape, 1 * PPI, -5000);
    expect(pt.x).toBeCloseTo(1 * PPI);
    expect(pt.y).toBeCloseTo(0);
  });

  it("triangle: exits below center when approaching from below", () => {
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2, type: "triangle" });
    const pt = shapeEdgePoint(shape, 1 * PPI, 5000);
    expect(pt.y).toBeCloseTo(2 * PPI); // bottom edge
  });

  // ── parallelogram ────────────────────────────────────────────────────────

  it("parallelogram: exits inside the bounding box width (skewed left)", () => {
    // 2×2 parallelogram: off = 96*0.4 = 38.4px
    // Top-left vertex: (cx - hw + off, cy - hh) = (96 - 96 + 38.4, 0) = (38.4, 0)
    const shape = makeShape({ x: 0, y: 0, width: 2, height: 2, type: "parallelogram" });
    const pt = shapeEdgePoint(shape, 1 * PPI, -5000); // approach from above
    expect(pt.y).toBeCloseTo(0); // hits the top edge
    // Top edge goes from x=38.4 to x=192 — exit x should be in that range
    expect(pt.x).toBeGreaterThan(0);
    expect(pt.x).toBeLessThanOrEqual(2 * PPI);
  });
});
