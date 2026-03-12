import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ShapeGeometry } from "./ShapeGeometry.js";
import type { ShapeType } from "@diagrammer/shared";

const svgStyle = { fill: "#ffffff", stroke: "#000000", strokeWidth: 1 };

function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

describe("ShapeGeometry", () => {
  const cases: ShapeType[] = [
    "rectangle",
    "rounded_rectangle",
    "ellipse",
    "diamond",
    "triangle",
    "parallelogram",
    "image",
  ];

  it.each(cases)("renders %s without throwing", (type) => {
    expect(() => renderInSvg(
      <ShapeGeometry type={type} width={100} height={60} style={svgStyle} />
    )).not.toThrow();
  });

  it("rectangle renders a <rect>", () => {
    const { container } = renderInSvg(
      <ShapeGeometry type="rectangle" width={100} height={60} style={svgStyle} />
    );
    expect(container.querySelector("rect")).toBeTruthy();
  });

  it("ellipse renders an <ellipse>", () => {
    const { container } = renderInSvg(
      <ShapeGeometry type="ellipse" width={100} height={60} style={svgStyle} />
    );
    expect(container.querySelector("ellipse")).toBeTruthy();
  });

  it("diamond renders a <polygon> with 4 points", () => {
    const { container } = renderInSvg(
      <ShapeGeometry type="diamond" width={100} height={60} style={svgStyle} />
    );
    const pts = container.querySelector("polygon")?.getAttribute("points") ?? "";
    expect(pts.trim().split(" ")).toHaveLength(4);
  });

  it("rounded_rectangle has rx attribute", () => {
    const { container } = renderInSvg(
      <ShapeGeometry type="rounded_rectangle" width={100} height={60} style={svgStyle} />
    );
    expect(container.querySelector("rect")?.getAttribute("rx")).toBe("8");
  });
});
