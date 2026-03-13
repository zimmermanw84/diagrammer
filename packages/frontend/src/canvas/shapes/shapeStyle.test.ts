import { describe, it, expect } from "vitest";
import { toSvgStyle } from "./shapeStyle.js";
import { DEFAULT_SHAPE_STYLE } from "@diagrammer/shared";
import type { ShapeStyle } from "@diagrammer/shared";

function style(overrides: Partial<ShapeStyle> = {}): ShapeStyle {
  return { ...DEFAULT_SHAPE_STYLE, ...overrides };
}

describe("toSvgStyle", () => {
  it("maps fillColor and strokeColor", () => {
    const result = toSvgStyle(style({ fillColor: "#ff0000", strokeColor: "#0000ff" }));
    expect(result.fill).toBe("#ff0000");
    expect(result.stroke).toBe("#0000ff");
  });

  it("maps strokeWidth", () => {
    const result = toSvgStyle(style({ strokeWidth: 3 }));
    expect(result.strokeWidth).toBe(3);
  });

  it("solid strokeDash → 'none' strokeDasharray", () => {
    const result = toSvgStyle(style({ strokeDash: "solid" }));
    expect(result.strokeDasharray).toBe("none");
  });

  it("dashed strokeDash → '8 4' strokeDasharray", () => {
    const result = toSvgStyle(style({ strokeDash: "dashed" }));
    expect(result.strokeDasharray).toBe("8 4");
  });

  it("dotted strokeDash → '2 4' strokeDasharray", () => {
    const result = toSvgStyle(style({ strokeDash: "dotted" }));
    expect(result.strokeDasharray).toBe("2 4");
  });

  it("shadow: true → filter: url(#shape-shadow)", () => {
    const result = toSvgStyle(style({ shadow: true }));
    expect(result.filter).toBe("url(#shape-shadow)");
  });

  it("shadow: false → no filter applied", () => {
    const result = toSvgStyle(style({ shadow: false }));
    expect(result.filter).toBeUndefined();
  });
});
