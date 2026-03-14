import { describe, it, expect } from "vitest";
import { computeMoves, distributeAlongAxis } from "./AlignmentToolbar";
import type { DiagramShape } from "@diagrammer/shared";

function shape(id: string, x: number, y: number, width = 1, height = 1): DiagramShape {
  return { id, x, y, width, height, type: "rectangle", label: "", style: {} as never, properties: {} };
}

describe("distributeAlongAxis", () => {
  const a = shape("a", 0, 0, 1, 1);
  const b = shape("b", 5, 2, 1, 1);
  const c = shape("c", 10, 4, 1, 1);

  it("distributes horizontally with equal gaps", () => {
    // span = 11-0 = 11, totalWidth = 3, gap = (11-3)/2 = 4
    const moves = distributeAlongAxis([b, c, a], "x", "width");
    const byId = Object.fromEntries(moves.map((m) => [m.id, m]));
    expect(byId["a"]!.x).toBeCloseTo(0);
    expect(byId["b"]!.x).toBeCloseTo(5);
    expect(byId["c"]!.x).toBeCloseTo(10);
    // y values are preserved
    expect(byId["a"]!.y).toBe(0);
    expect(byId["b"]!.y).toBe(2);
    expect(byId["c"]!.y).toBe(4);
  });

  it("distributes vertically with equal gaps", () => {
    // span = 5-0 = 5, totalHeight = 3, gap = (5-3)/2 = 1
    const s1 = shape("s1", 1, 0, 1, 1);
    const s2 = shape("s2", 2, 2, 1, 1);
    const s3 = shape("s3", 3, 4, 1, 1);
    const moves = distributeAlongAxis([s2, s3, s1], "y", "height");
    const byId = Object.fromEntries(moves.map((m) => [m.id, m]));
    expect(byId["s1"]!.y).toBeCloseTo(0);
    expect(byId["s2"]!.y).toBeCloseTo(2);
    expect(byId["s3"]!.y).toBeCloseTo(4);
    // x values are preserved
    expect(byId["s1"]!.x).toBe(1);
    expect(byId["s2"]!.x).toBe(2);
    expect(byId["s3"]!.x).toBe(3);
  });

  it("evenly spaces shapes with unequal sizes horizontally", () => {
    // widths: 1, 2, 3. span = 0 to (9+3)=12, totalWidth=6, gap=(12-6)/2=3
    const w1 = shape("w1", 0, 0, 1, 1);
    const w2 = shape("w2", 4, 0, 2, 1);
    const w3 = shape("w3", 9, 0, 3, 1);
    const moves = distributeAlongAxis([w2, w3, w1], "x", "width");
    const byId = Object.fromEntries(moves.map((m) => [m.id, m]));
    expect(byId["w1"]!.x).toBeCloseTo(0);  // cursor starts at 0
    expect(byId["w2"]!.x).toBeCloseTo(4);  // 0 + 1 + 3 = 4
    expect(byId["w3"]!.x).toBeCloseTo(9);  // 4 + 2 + 3 = 9
  });
});

describe("computeMoves — distribute ops", () => {
  it("distributeH delegates to distributeAlongAxis on x axis", () => {
    const shapes = [
      shape("a", 0, 5, 1, 1),
      shape("b", 5, 5, 1, 1),
      shape("c", 10, 5, 1, 1),
    ];
    const moves = computeMoves(shapes, "distributeH");
    expect(moves).toHaveLength(3);
    moves.forEach((m) => expect(m.y).toBe(5));
  });

  it("distributeV delegates to distributeAlongAxis on y axis", () => {
    const shapes = [
      shape("a", 5, 0, 1, 1),
      shape("b", 5, 5, 1, 1),
      shape("c", 5, 10, 1, 1),
    ];
    const moves = computeMoves(shapes, "distributeV");
    expect(moves).toHaveLength(3);
    moves.forEach((m) => expect(m.x).toBe(5));
  });
});
