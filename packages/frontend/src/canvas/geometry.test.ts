import { describe, it, expect } from "vitest";
import { DEFAULT_SHAPE_STYLE } from "@diagrammer/shared";
import type { DiagramShape } from "@diagrammer/shared";
import { shapeCenter, rayPolygonEdge, shapeEdgePoint } from "./geometry.js";

// All shapes: 2" × 2" at origin → center at (96px, 96px), half-width/height = 96px
function makeShape(type: DiagramShape["type"]): DiagramShape {
  return { id: "1", type, x: 0, y: 0, width: 2, height: 2, label: "", style: { ...DEFAULT_SHAPE_STYLE }, properties: {} };
}

// ---------------------------------------------------------------------------
// shapeCenter
// ---------------------------------------------------------------------------

describe("shapeCenter", () => {
  it("returns center in pixels for a shape at origin", () => {
    const c = shapeCenter(makeShape("rectangle"));
    expect(c.x).toBeCloseTo(96);
    expect(c.y).toBeCloseTo(96);
  });

  it("accounts for non-zero x/y position", () => {
    const shape: DiagramShape = { ...makeShape("rectangle"), x: 1, y: 2 };
    const c = shapeCenter(shape);
    // center = (x + w/2) * 96, (y + h/2) * 96
    expect(c.x).toBeCloseTo((1 + 1) * 96); // 192
    expect(c.y).toBeCloseTo((2 + 1) * 96); // 288
  });
});

// ---------------------------------------------------------------------------
// rayPolygonEdge
// ---------------------------------------------------------------------------

describe("rayPolygonEdge", () => {
  // Unit square centred at (50, 50)
  const square = [
    { x: 0,   y: 0   },
    { x: 100, y: 0   },
    { x: 100, y: 100 },
    { x: 0,   y: 100 },
  ];

  it("ray toward right hits the right edge at midpoint", () => {
    const pt = rayPolygonEdge(50, 50, 999, 50, square);
    expect(pt.x).toBeCloseTo(100);
    expect(pt.y).toBeCloseTo(50);
  });

  it("ray toward left hits the left edge at midpoint", () => {
    const pt = rayPolygonEdge(50, 50, -999, 50, square);
    expect(pt.x).toBeCloseTo(0);
    expect(pt.y).toBeCloseTo(50);
  });

  it("ray toward top hits the top edge at midpoint", () => {
    const pt = rayPolygonEdge(50, 50, 50, -999, square);
    expect(pt.x).toBeCloseTo(50);
    expect(pt.y).toBeCloseTo(0);
  });

  it("ray toward bottom hits the bottom edge at midpoint", () => {
    const pt = rayPolygonEdge(50, 50, 50, 999, square);
    expect(pt.x).toBeCloseTo(50);
    expect(pt.y).toBeCloseTo(100);
  });

  it("ray toward upper-right corner hits the corner", () => {
    // Direction must point at the actual corner (100,0), not an approximation
    const pt = rayPolygonEdge(50, 50, 100, 0, square);
    expect(pt.x).toBeCloseTo(100);
    expect(pt.y).toBeCloseTo(0);
  });

  it("returns origin point when direction is zero (degenerate case)", () => {
    const pt = rayPolygonEdge(50, 50, 50, 50, square);
    // No movement — returns the start point (best stays at cx, cy)
    expect(pt.x).toBeCloseTo(50);
    expect(pt.y).toBeCloseTo(50);
  });
});

// ---------------------------------------------------------------------------
// shapeEdgePoint — rectangle (axis-aligned bounding box)
// ---------------------------------------------------------------------------

describe("shapeEdgePoint — rectangle", () => {
  const shape = makeShape("rectangle"); // center (96, 96), hw=96, hh=96

  it("ray toward right hits the right edge", () => {
    const pt = shapeEdgePoint(shape, 999, 96);
    expect(pt.x).toBeCloseTo(192);
    expect(pt.y).toBeCloseTo(96);
  });

  it("ray toward left hits the left edge", () => {
    const pt = shapeEdgePoint(shape, -999, 96);
    expect(pt.x).toBeCloseTo(0);
    expect(pt.y).toBeCloseTo(96);
  });

  it("ray toward bottom hits the bottom edge", () => {
    const pt = shapeEdgePoint(shape, 96, 999);
    expect(pt.x).toBeCloseTo(96);
    expect(pt.y).toBeCloseTo(192);
  });

  it("ray toward top hits the top edge", () => {
    const pt = shapeEdgePoint(shape, 96, -999);
    expect(pt.x).toBeCloseTo(96);
    expect(pt.y).toBeCloseTo(0);
  });

  it("returns center when direction is zero", () => {
    const pt = shapeEdgePoint(shape, 96, 96);
    expect(pt.x).toBeCloseTo(96);
    expect(pt.y).toBeCloseTo(96);
  });
});

// ---------------------------------------------------------------------------
// shapeEdgePoint — rounded_rectangle (same bbox logic as rectangle)
// ---------------------------------------------------------------------------

describe("shapeEdgePoint — rounded_rectangle", () => {
  const shape = makeShape("rounded_rectangle");

  it("ray toward right hits the right edge", () => {
    const pt = shapeEdgePoint(shape, 999, 96);
    expect(pt.x).toBeCloseTo(192);
    expect(pt.y).toBeCloseTo(96);
  });
});

// ---------------------------------------------------------------------------
// shapeEdgePoint — ellipse (closed-form angle)
// ---------------------------------------------------------------------------

describe("shapeEdgePoint — ellipse", () => {
  const shape = makeShape("ellipse"); // center (96, 96), hw=96, hh=96

  it("ray toward right hits (cx+hw, cy)", () => {
    const pt = shapeEdgePoint(shape, 999, 96);
    expect(pt.x).toBeCloseTo(192);
    expect(pt.y).toBeCloseTo(96);
  });

  it("ray toward left hits (cx-hw, cy)", () => {
    const pt = shapeEdgePoint(shape, -999, 96);
    expect(pt.x).toBeCloseTo(0);
    expect(pt.y).toBeCloseTo(96);
  });

  it("ray toward bottom hits (cx, cy+hh)", () => {
    const pt = shapeEdgePoint(shape, 96, 999);
    expect(pt.x).toBeCloseTo(96);
    expect(pt.y).toBeCloseTo(192);
  });

  it("ray toward top hits (cx, cy-hh)", () => {
    const pt = shapeEdgePoint(shape, 96, -999);
    expect(pt.x).toBeCloseTo(96);
    expect(pt.y).toBeCloseTo(0);
  });
});

// ---------------------------------------------------------------------------
// shapeEdgePoint — diamond (rotated square polygon)
// ---------------------------------------------------------------------------

describe("shapeEdgePoint — diamond", () => {
  // Vertices: (96,0), (192,96), (96,192), (0,96)
  const shape = makeShape("diamond");

  it("ray toward right hits the right vertex", () => {
    const pt = shapeEdgePoint(shape, 999, 96);
    expect(pt.x).toBeCloseTo(192);
    expect(pt.y).toBeCloseTo(96);
  });

  it("ray toward top hits the top vertex", () => {
    const pt = shapeEdgePoint(shape, 96, -999);
    expect(pt.x).toBeCloseTo(96);
    expect(pt.y).toBeCloseTo(0);
  });

  it("ray toward bottom hits the bottom vertex", () => {
    const pt = shapeEdgePoint(shape, 96, 999);
    expect(pt.x).toBeCloseTo(96);
    expect(pt.y).toBeCloseTo(192);
  });
});

// ---------------------------------------------------------------------------
// shapeEdgePoint — triangle
// ---------------------------------------------------------------------------

describe("shapeEdgePoint — triangle", () => {
  // Vertices: top (96,0), bottom-right (192,192), bottom-left (0,192)
  const shape = makeShape("triangle");

  it("ray toward bottom hits the centre of the bottom edge", () => {
    const pt = shapeEdgePoint(shape, 96, 999);
    expect(pt.x).toBeCloseTo(96);
    expect(pt.y).toBeCloseTo(192);
  });

  it("ray toward top hits the apex", () => {
    const pt = shapeEdgePoint(shape, 96, -999);
    expect(pt.x).toBeCloseTo(96);
    expect(pt.y).toBeCloseTo(0);
  });
});

// ---------------------------------------------------------------------------
// shapeEdgePoint — parallelogram
// ---------------------------------------------------------------------------

describe("shapeEdgePoint — parallelogram", () => {
  const shape = makeShape("parallelogram");
  // off = 96 * 0.4 = 38.4
  // Vertices: (38.4, 0), (192, 0), (153.6, 192), (0, 192)

  it("ray toward top hits the top edge", () => {
    const pt = shapeEdgePoint(shape, 96, -999);
    expect(pt.y).toBeCloseTo(0);
  });

  it("ray toward bottom hits the bottom edge", () => {
    const pt = shapeEdgePoint(shape, 96, 999);
    expect(pt.y).toBeCloseTo(192);
  });
});
