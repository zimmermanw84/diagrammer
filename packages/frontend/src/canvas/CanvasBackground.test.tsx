import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CanvasBackground } from "./CanvasBackground";
import { PPI } from "./units";

// CanvasBackground must be rendered inside an <svg> to produce valid DOM.
function renderInSvg(w: number, h: number) {
  return render(
    <svg>
      <CanvasBackground width={w} height={h} />
    </svg>
  );
}

describe("CanvasBackground", () => {
  it("renders a #grid-minor pattern", () => {
    const { container } = renderInSvg(1056, 816);
    expect(container.querySelector("#grid-minor")).toBeTruthy();
  });

  it("renders a #grid-major pattern", () => {
    const { container } = renderInSvg(1056, 816);
    expect(container.querySelector("#grid-major")).toBeTruthy();
  });

  it("minor pattern is spaced PPI/4 (24px)", () => {
    const { container } = renderInSvg(1056, 816);
    const minor = container.querySelector("#grid-minor")!;
    expect(Number(minor.getAttribute("width"))).toBe(PPI / 4);
    expect(Number(minor.getAttribute("height"))).toBe(PPI / 4);
  });

  it("major pattern is spaced PPI (96px)", () => {
    const { container } = renderInSvg(1056, 816);
    const major = container.querySelector("#grid-major")!;
    expect(Number(major.getAttribute("width"))).toBe(PPI);
    expect(Number(major.getAttribute("height"))).toBe(PPI);
  });

  it("both patterns use patternUnits='userSpaceOnUse'", () => {
    const { container } = renderInSvg(1056, 816);
    for (const id of ["#grid-minor", "#grid-major"]) {
      expect(container.querySelector(id)!.getAttribute("patternUnits")).toBe(
        "userSpaceOnUse"
      );
    }
  });

  it("renders a background rect filled with url(#grid-major)", () => {
    const { container } = renderInSvg(1056, 816);
    const rects = Array.from(container.querySelectorAll("rect"));
    const bg = rects.find((r) => r.getAttribute("fill") === "url(#grid-major)");
    expect(bg).toBeTruthy();
  });

  it("background rect dimensions match props", () => {
    const { container } = renderInSvg(1056, 816);
    const rects = Array.from(container.querySelectorAll("rect"));
    const bg = rects.find((r) => r.getAttribute("fill") === "url(#grid-major)")!;
    expect(Number(bg.getAttribute("width"))).toBe(1056);
    expect(Number(bg.getAttribute("height"))).toBe(816);
  });

  it("background rect dimensions update when props change", () => {
    const { container, rerender } = renderInSvg(500, 400);
    rerender(
      <svg>
        <CanvasBackground width={800} height={600} />
      </svg>
    );
    const rects = Array.from(container.querySelectorAll("rect"));
    const bg = rects.find((r) => r.getAttribute("fill") === "url(#grid-major)")!;
    expect(Number(bg.getAttribute("width"))).toBe(800);
    expect(Number(bg.getAttribute("height"))).toBe(600);
  });
});
