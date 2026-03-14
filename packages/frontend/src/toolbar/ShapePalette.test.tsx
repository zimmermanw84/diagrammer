import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShapePalette, LIBRARIES } from "./ShapePalette.js";
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT } from "../canvas/canvasConstants.js";
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

describe("default shape dimensions (B7 regression)", () => {
  it("DEFAULT_SHAPE_WIDTH is wider than DEFAULT_SHAPE_HEIGHT — shapes are rectangles not squares", () => {
    expect(DEFAULT_SHAPE_WIDTH).toBeGreaterThan(DEFAULT_SHAPE_HEIGHT);
  });

  it("drop placement uses different offsets for x and y — not a square centering", () => {
    const onAddShape = vi.fn();
    const svgRef = makeSvgRef({ left: 0, top: 0, right: 1000, bottom: 700 });
    render(<ShapePalette svgRef={svgRef} transform={defaultTransform} onAddShape={onAddShape} />);

    // Drop at exactly (96px, 96px) in svg space = (1in, 1in)
    fireEvent.mouseDown(screen.getByTitle("Rectangle"), { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(window, { clientX: 96, clientY: 96 });

    const [, x, y] = onAddShape.mock.calls[0] as [ShapeType, number, number];
    // x offset = 1in - DEFAULT_SHAPE_WIDTH/2, y offset = 1in - DEFAULT_SHAPE_HEIGHT/2
    expect(x).not.toBeCloseTo(y); // width ≠ height means centering offsets differ
  });
});

describe("ShapePalette — libraries", () => {
  it("renders a collapsible header for each library", () => {
    renderPalette();
    for (const lib of LIBRARIES) {
      expect(screen.getByLabelText(lib.name)).toBeTruthy();
    }
  });

  it("renders 'Basic Shapes' and 'Flowchart' library headers", () => {
    renderPalette();
    expect(screen.getByText("Basic Shapes")).toBeTruthy();
    expect(screen.getByText("Flowchart")).toBeTruthy();
  });

  it("all libraries are expanded by default", () => {
    renderPalette();
    for (const lib of LIBRARIES) {
      const btn = screen.getByLabelText(lib.name);
      expect(btn.getAttribute("aria-expanded")).toBe("true");
    }
  });

  it("collapses a library when its header is clicked", () => {
    renderPalette();
    const btn = screen.getByLabelText("Basic Shapes");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    // Basic Shapes tiles should be hidden
    expect(screen.queryByTitle("Rectangle")).toBeNull();
  });

  it("re-expands a library when its header is clicked again", () => {
    renderPalette();
    const btn = screen.getByLabelText("Basic Shapes");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTitle("Rectangle")).toBeTruthy();
  });

  it("collapsing one library does not affect other libraries", () => {
    renderPalette();
    fireEvent.click(screen.getByLabelText("Basic Shapes"));
    // Flowchart tiles should still be visible
    expect(screen.getByTitle("Process")).toBeTruthy();
    expect(screen.getByTitle("Decision")).toBeTruthy();
  });

  it("renders all Basic Shapes tiles when expanded", () => {
    renderPalette();
    const labels = ["Rectangle", "Ellipse", "Diamond", "Rounded", "Triangle", "Parallel"];
    for (const label of labels) {
      expect(screen.getByTitle(label)).toBeTruthy();
    }
  });

  it("renders all Flowchart tiles when expanded", () => {
    renderPalette();
    const labels = ["Process", "Decision", "Terminator", "Data", "Start/End"];
    for (const label of labels) {
      expect(screen.getByTitle(label)).toBeTruthy();
    }
  });
});

describe("ShapePalette — drag and drop", () => {
  beforeEach(() => {
    vi.spyOn(window, "addEventListener");
    vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers window listeners on mousedown and cleans them up on mouseup", () => {
    renderPalette();
    const tile = screen.getByTitle("Rectangle");

    fireEvent.mouseDown(tile, { clientX: 50, clientY: 50 });
    expect(window.addEventListener).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith("mouseup", expect.any(Function));

    fireEvent.mouseUp(window);
    expect(window.removeEventListener).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith("mouseup", expect.any(Function));
  });

  it("shows the ghost element during drag", () => {
    const { container } = render(
      <ShapePalette svgRef={makeSvgRef()} transform={defaultTransform} onAddShape={vi.fn()} />
    );
    expect(container.querySelectorAll("[style*='position: fixed']").length).toBe(0);
    fireEvent.mouseDown(screen.getByTitle("Ellipse"), { clientX: 50, clientY: 50 });
    expect(container.querySelectorAll("[style*='position: fixed']").length).toBe(1);
  });

  it("calls onAddShape with the correct type when dropped inside the canvas", () => {
    const onAddShape = vi.fn();
    const svgRef = makeSvgRef({ left: 200, top: 100, right: 1000, bottom: 700 });
    render(<ShapePalette svgRef={svgRef} transform={defaultTransform} onAddShape={onAddShape} />);

    fireEvent.mouseDown(screen.getByTitle("Diamond"), { clientX: 50, clientY: 50 });
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
    fireEvent.mouseUp(window, { clientX: 50, clientY: 400 });

    expect(onAddShape).not.toHaveBeenCalled();
  });

  it("places the shape centered on the drop point", () => {
    // Drop at clientX=296, clientY=196 → svgX=96px, svgY=96px
    // inchX = 96/96 - DEFAULT_SHAPE_WIDTH/2 = 1 - 0.75 = 0.25
    // inchY = 96/96 - DEFAULT_SHAPE_HEIGHT/2 = 1 - 0.5 = 0.5
    const onAddShape = vi.fn();
    const svgRef = makeSvgRef({ left: 200, top: 100, right: 1000, bottom: 700 });
    render(<ShapePalette svgRef={svgRef} transform={defaultTransform} onAddShape={onAddShape} />);

    fireEvent.mouseDown(screen.getByTitle("Rectangle"), { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(window, { clientX: 296, clientY: 196 });

    expect(onAddShape).toHaveBeenCalledOnce();
    const [, x, y] = onAddShape.mock.calls[0] as [ShapeType, number, number];
    expect(x).toBeCloseTo(0.25);
    expect(y).toBeCloseTo(0.5);
  });

  it("calls onAddShape with negative coordinates when dropped near the canvas origin", () => {
    const onAddShape = vi.fn();
    const svgRef = makeSvgRef({ left: 200, top: 100, right: 1000, bottom: 700 });
    render(<ShapePalette svgRef={svgRef} transform={defaultTransform} onAddShape={onAddShape} />);

    fireEvent.mouseDown(screen.getByTitle("Rectangle"), { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(window, { clientX: 204, clientY: 104 });

    expect(onAddShape).toHaveBeenCalledOnce();
    const [, x, y] = onAddShape.mock.calls[0] as [ShapeType, number, number];
    expect(x).toBeLessThan(0);
    expect(y).toBeLessThan(0);
  });

  it("accounts for canvas transform (zoom + pan) when computing drop position", () => {
    // Drop at clientX=296, clientY=196 with scale=2, panX=48
    // svgX = (296-200-48)/2 = 24px, svgY = (196-100-0)/2 = 48px
    // inchX = 24/96 - DEFAULT_SHAPE_WIDTH/2 = 0.25 - 0.75 = -0.5
    // inchY = 48/96 - DEFAULT_SHAPE_HEIGHT/2 = 0.5 - 0.5 = 0
    const onAddShape = vi.fn();
    const svgRef = makeSvgRef({ left: 200, top: 100, right: 1000, bottom: 700 });
    const transform = { scale: 2, x: 48, y: 0 };
    render(<ShapePalette svgRef={svgRef} transform={transform} onAddShape={onAddShape} />);

    fireEvent.mouseDown(screen.getByTitle("Ellipse"), { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(window, { clientX: 296, clientY: 196 });

    expect(onAddShape).toHaveBeenCalledOnce();
    const [, x, y] = onAddShape.mock.calls[0] as [ShapeType, number, number];
    expect(x).toBeCloseTo(-0.5);
    expect(y).toBeCloseTo(0);
  });

  it("calls onAddShape with the Flowchart Process type (rectangle) on drop", () => {
    const onAddShape = vi.fn();
    const svgRef = makeSvgRef({ left: 200, top: 100, right: 1000, bottom: 700 });
    render(<ShapePalette svgRef={svgRef} transform={defaultTransform} onAddShape={onAddShape} />);

    fireEvent.mouseDown(screen.getByTitle("Process"), { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(window, { clientX: 500, clientY: 400 });

    expect(onAddShape).toHaveBeenCalledOnce();
    const [type] = onAddShape.mock.calls[0] as [ShapeType, number, number];
    expect(type).toBe("rectangle");
  });
});
