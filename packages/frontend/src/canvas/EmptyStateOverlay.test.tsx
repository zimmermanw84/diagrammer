import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EmptyStateOverlay } from "./EmptyStateOverlay";

// EmptyStateOverlay must be rendered inside an <svg> to produce valid DOM.
function renderInSvg(pageW: number, pageH: number) {
  return render(
    <svg>
      <EmptyStateOverlay pageW={pageW} pageH={pageH} />
    </svg>
  );
}

describe("EmptyStateOverlay", () => {
  it("renders two <text> elements", () => {
    const { container } = renderInSvg(1056, 816);
    expect(container.querySelectorAll("text")).toHaveLength(2);
  });

  it("primary text is centered horizontally at pageW/2", () => {
    const { container } = renderInSvg(1056, 816);
    const texts = container.querySelectorAll("text");
    expect(Number(texts[0].getAttribute("x"))).toBe(528);
  });

  it("secondary text is centered horizontally at pageW/2", () => {
    const { container } = renderInSvg(1056, 816);
    const texts = container.querySelectorAll("text");
    expect(Number(texts[1].getAttribute("x"))).toBe(528);
  });

  it("primary text is positioned above vertical center", () => {
    const { container } = renderInSvg(1056, 816);
    const texts = container.querySelectorAll("text");
    const cy = 816 / 2;
    expect(Number(texts[0].getAttribute("y"))).toBeLessThan(cy);
  });

  it("secondary text is positioned below vertical center", () => {
    const { container } = renderInSvg(1056, 816);
    const texts = container.querySelectorAll("text");
    const cy = 816 / 2;
    expect(Number(texts[1].getAttribute("y"))).toBeGreaterThan(cy);
  });

  it("wrapper <g> has pointerEvents none", () => {
    const { container } = renderInSvg(1056, 816);
    const g = container.querySelector("g");
    expect(g?.style.pointerEvents).toBe("none");
  });

  it("primary text has textAnchor middle", () => {
    const { container } = renderInSvg(1056, 816);
    const texts = container.querySelectorAll("text");
    expect(texts[0].getAttribute("text-anchor")).toBe("middle");
  });
});
