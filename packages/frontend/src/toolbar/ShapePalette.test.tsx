import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShapePalette } from "./ShapePalette.js";
import type { ShapeType } from "@diagrammer/shared";
import { createRef } from "react";

function makeSvgRef(bounds: Partial<DOMRect> = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.getBoundingClientRect = () => ({
    left: bounds.left ?? 200,
    top: bounds.top ?? 100,
    right: bounds.right ?? 1000,
    bottom: bounds.bottom ?? 700,
    width: (bounds.right ?? 1000) - (bounds.left ?? 200),
    height: (bounds.bottom ?? 700) - (bounds.top ?? 100),
    x: bounds.left ?? 200,
    y: bounds.top ?? 100,
    toJSON: () => ({}),
  });
  const ref = createRef<SVGSVGElement>();
  Object.defineProperty(ref, "current", { value: svg, writable: false });
  return ref;
}

const defaultTransform = { scale: 1, x: 0, y: 0 };

function renderPalette(onAddShape = vi.fn(), transform = defaultTransform) {
  const svgRef = makeSvgRef();
  render(<ShapePalette svgRef={svgRef} transform={transform} onAddShape={onAddShape} />);
  return { svgRef, onAddShape };
}

describe("ShapePalette", () => {
  beforeEach(() => {
    // Prevent jsdom errors from window event listeners
    vi.spyOn(window, "addEventListener");
    vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a tile for each shape type", () => {
    renderPalette();
    const labels = ["Rectangle", "Ellipse", "Diamond", "Rounded", "Triangle", "Parallel"];
    for (const label of labels) {
      expect(screen.getByTitle(label)).toBeTruthy();
    }
  });

  it("renders the Shapes heading", () => {
    renderPalette();
    expect(screen.getByText("Shapes")).toBeTruthy();
  });

  it("renders 6 tiles total", () => {
    const { container } = render(
      <ShapePalette
        svgRef={makeSvgRef()}
        transform={defaultTransform}
        onAddShape={vi.fn()}
      />
    );
    // Each tile has a title attribute
    const tiles = container.querySelectorAll("[title]");
    expect(tiles.length).toBe(6);
  });

  it("registers window listeners on mousedown and cleans them up on mouseup", () => {
    renderPalette();
    const tile = screen.getByTitle("Rectangle");

    fireEvent.mouseDown(tile, { clientX: 50, clientY: 50 });
    expect(window.addEventListener).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith("mouseup", expect.any(Function));

    // Simulate mouseup to trigger cleanup
    fireEvent.mouseUp(window);
    expect(window.removeEventListener).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith("mouseup", expect.any(Function));
  });

  it("shows the ghost element during drag", () => {
    const { container } = render(
      <ShapePalette
        svgRef={makeSvgRef()}
        transform={defaultTransform}
        onAddShape={vi.fn()}
      />
    );
    // Ghost should not be visible before drag
    expect(container.querySelectorAll("[style*='position: fixed']").length).toBe(0);

    fireEvent.mouseDown(screen.getByTitle("Ellipse"), { clientX: 50, clientY: 50 });
    expect(container.querySelectorAll("[style*='position: fixed']").length).toBe(1);
  });

  it("calls onAddShape with the correct type when dropped inside the canvas", () => {
    const onAddShape = vi.fn();
    const svgRef = makeSvgRef({ left: 200, top: 100, right: 1000, bottom: 700 });
    render(<ShapePalette svgRef={svgRef} transform={defaultTransform} onAddShape={onAddShape} />);

    fireEvent.mouseDown(screen.getByTitle("Diamond"), { clientX: 50, clientY: 50 });

    // Drop inside the SVG bounds (left: 200, top: 100, right: 1000, bottom: 700)
    fireEvent.mouseUp(window, { clientX: 500, clientY: 400 });

    expect(onAddShape).toHaveBeenCalledOnce();
    const [type] = onAddShape.mock.calls[0] as [ShapeType, number, number];
    expect(type).toBe("diamond");
  });

  it("does not call onAddShape when dropped outside the canvas", () => {
    const onAddShape = vi.fn();
    const svgRef = makeSvgRef({ left: 200, top: 100, right: 1000, bottom: 700 });
    render(<ShapePalette svgRef={svgRef} transform={defaultTransform} onAddShape={onAddShape} />);

    fireEvent.mouseDown(screen.getByTitle("Rectangle"), { clientX: 50, clientY: 50 });

    // Drop to the left of the canvas (clientX < 200)
    fireEvent.mouseUp(window, { clientX: 50, clientY: 400 });

    expect(onAddShape).not.toHaveBeenCalled();
  });

  it("places the shape centered on the drop point", () => {
    const onAddShape = vi.fn();
    // Canvas at (200, 100), scale=1, no pan offset
    const svgRef = makeSvgRef({ left: 200, top: 100, right: 1000, bottom: 700 });
    render(<ShapePalette svgRef={svgRef} transform={defaultTransform} onAddShape={onAddShape} />);

    fireEvent.mouseDown(screen.getByTitle("Rectangle"), { clientX: 50, clientY: 50 });
    // Drop at clientX=296, clientY=196 → svgX=96px, svgY=96px → 1 inch → center offset 0.5"
    fireEvent.mouseUp(window, { clientX: 296, clientY: 196 });

    expect(onAddShape).toHaveBeenCalledOnce();
    const [, x, y] = onAddShape.mock.calls[0] as [ShapeType, number, number];
    // Expected: toInches(96) - 0.5 = 1 - 0.5 = 0.5
    expect(x).toBeCloseTo(0.5);
    expect(y).toBeCloseTo(0.5);
  });

  it("calls onAddShape with negative coordinates when dropped near the canvas origin", () => {
    const onAddShape = vi.fn();
    const svgRef = makeSvgRef({ left: 200, top: 100, right: 1000, bottom: 700 });
    render(<ShapePalette svgRef={svgRef} transform={defaultTransform} onAddShape={onAddShape} />);

    fireEvent.mouseDown(screen.getByTitle("Rectangle"), { clientX: 50, clientY: 50 });
    // Drop just inside the top-left corner: svgX = 204-200 = 4px, svgY = 104-100 = 4px
    // toInches(4) ≈ 0.042" → x = 0.042 - 0.5 ≈ -0.458 (negative, no clamping applied)
    fireEvent.mouseUp(window, { clientX: 204, clientY: 104 });

    expect(onAddShape).toHaveBeenCalledOnce();
    const [, x, y] = onAddShape.mock.calls[0] as [ShapeType, number, number];
    expect(x).toBeLessThan(0);
    expect(y).toBeLessThan(0);
  });

  it("accounts for canvas transform (zoom + pan) when computing drop position", () => {
    const onAddShape = vi.fn();
    const svgRef = makeSvgRef({ left: 200, top: 100, right: 1000, bottom: 700 });
    // Scale=2, pan offset x=48px, y=0
    const transform = { scale: 2, x: 48, y: 0 };
    render(<ShapePalette svgRef={svgRef} transform={transform} onAddShape={onAddShape} />);

    fireEvent.mouseDown(screen.getByTitle("Ellipse"), { clientX: 50, clientY: 50 });
    // clientX=296, clientY=196
    // svgX = (296 - 200 - 48) / 2 = 48/2 = 24px → toInches(24) = 0.25" → x = 0.25 - 0.5 = -0.25
    // svgY = (196 - 100 - 0) / 2 = 96/2 = 48px → toInches(48) = 0.5" → y = 0.5 - 0.5 = 0
    fireEvent.mouseUp(window, { clientX: 296, clientY: 196 });

    expect(onAddShape).toHaveBeenCalledOnce();
    const [, x, y] = onAddShape.mock.calls[0] as [ShapeType, number, number];
    expect(x).toBeCloseTo(-0.25);
    expect(y).toBeCloseTo(0);
  });
});
