import { describe, it, expect } from "vitest";
import { buildPath } from "./routing.js";

const FROM = { x: 0, y: 0 };
const TO   = { x: 100, y: 50 };
const MID_X = 50;

describe("buildPath — straight", () => {
  it("produces a simple M L path", () => {
    expect(buildPath(FROM, TO, "straight", MID_X)).toBe("M 0,0 L 100,50");
  });

  it("works when from and to are the same point", () => {
    expect(buildPath(FROM, FROM, "straight", MID_X)).toBe("M 0,0 L 0,0");
  });
});

describe("buildPath — right_angle", () => {
  it("produces an axis-aligned elbow path through midX", () => {
    expect(buildPath(FROM, TO, "right_angle", MID_X))
      .toBe("M 0,0 L 50,0 L 50,50 L 100,50");
  });

  it("uses the provided midX value for the elbow", () => {
    expect(buildPath(FROM, TO, "right_angle", 20))
      .toBe("M 0,0 L 20,0 L 20,50 L 100,50");
  });

  it("works for vertical connections (from.x === to.x)", () => {
    expect(buildPath({ x: 50, y: 0 }, { x: 50, y: 100 }, "right_angle", 50))
      .toBe("M 50,0 L 50,0 L 50,100 L 50,100");
  });
});

describe("buildPath — curved", () => {
  it("produces a cubic bezier starting at from and ending at to", () => {
    const path = buildPath(FROM, TO, "curved", MID_X);
    expect(path).toMatch(/^M 0,0 C /);
    expect(path).toMatch(/100,50$/);
  });

  it("control points are offset vertically by half the dy", () => {
    // from=(0,0) to=(0,100): dy=100, half=50
    // expected: M 0,0 C 0,50 0,50 0,100
    const path = buildPath({ x: 0, y: 0 }, { x: 0, y: 100 }, "curved", 0);
    expect(path).toBe("M 0,0 C 0,50 0,50 0,100");
  });

  it("works for same-y connections (flat curve)", () => {
    // from=(0,50) to=(100,50): dy=0, control points stay at y=50
    const path = buildPath({ x: 0, y: 50 }, { x: 100, y: 50 }, "curved", 50);
    expect(path).toBe("M 0,50 C 0,50 100,50 100,50");
  });
});
