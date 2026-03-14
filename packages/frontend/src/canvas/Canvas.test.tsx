import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import { Canvas } from "./Canvas";
import type { DiagramPage } from "@diagrammer/shared";

const PAGE: DiagramPage = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Page 1",
  width: 11,
  height: 8.5,
  shapes: [],
  connectors: [],
};

/** Parse the transform attribute on the top-level <g> inside the svg. */
function getTransform(container: HTMLElement) {
  const g = container.querySelector("svg > g")!;
  const t = g.getAttribute("transform") ?? "";
  const tx = t.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
  const sc = t.match(/scale\(([-\d.]+)\)/);
  return {
    x: tx ? parseFloat(tx[1]) : 0,
    y: tx ? parseFloat(tx[2]) : 0,
    scale: sc ? parseFloat(sc[1]) : 1,
  };
}

beforeEach(() => {
  // jsdom/happy-dom returns zeroes for getBoundingClientRect by default.
  // Simulate a 800×600 canvas viewport so centering maths are predictable.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe("Canvas — structure", () => {
  it("renders an <svg> element", () => {
    const { container } = render(<Canvas page={PAGE} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders a <g> with a transform attribute", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const g = container.querySelector("svg > g");
    expect(g?.getAttribute("transform")).toBeTruthy();
  });

  it("renders children inside the <g>", () => {
    const { getByText } = render(
      <Canvas page={PAGE}>
        <text>hello</text>
      </Canvas>
    );
    expect(getByText("hello")).toBeTruthy();
  });

  it("renders a page background rect sized to page dimensions in pixels (11in x 8.5in = 1056x816)", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const rects = Array.from(container.querySelectorAll("rect"));
    const page = rects.find(
      (r) => r.getAttribute("width") === "1056" && r.getAttribute("height") === "816"
    );
    expect(page).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Initial centering
// ---------------------------------------------------------------------------

describe("Canvas — initial centering", () => {
  it("centers the page within the mocked 800×600 viewport", () => {
    // page is 1056×816 px; viewport is 800×600
    // expected: x = (800 - 1056) / 2 = -128, y = (600 - 816) / 2 = -108
    const { container } = render(<Canvas page={PAGE} />);
    const { x, y } = getTransform(container);
    expect(x).toBeCloseTo(-128);
    expect(y).toBeCloseTo(-108);
  });

  it("initial scale is 1", () => {
    const { container } = render(<Canvas page={PAGE} />);
    expect(getTransform(container).scale).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Zoom
// ---------------------------------------------------------------------------

describe("Canvas — zoom", () => {
  it("wheel up (negative deltaY) increases scale", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const svg = container.querySelector("svg")!;

    act(() => {
      svg.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: -200,
          clientX: 400,
          clientY: 300,
          bubbles: true,
          cancelable: true,
        })
      );
    });

    expect(getTransform(container).scale).toBeGreaterThan(1);
  });

  it("wheel down (positive deltaY) decreases scale", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const svg = container.querySelector("svg")!;

    act(() => {
      svg.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: 200,
          clientX: 400,
          clientY: 300,
          bubbles: true,
          cancelable: true,
        })
      );
    });

    expect(getTransform(container).scale).toBeLessThan(1);
  });

  it("scale is clamped at MAX_SCALE (8) — repeated wheel-up cannot exceed it", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const svg = container.querySelector("svg")!;

    act(() => {
      // Fire many large wheel-up events
      for (let i = 0; i < 50; i++) {
        svg.dispatchEvent(
          new WheelEvent("wheel", { deltaY: -5000, clientX: 400, clientY: 300, bubbles: true })
        );
      }
    });

    expect(getTransform(container).scale).toBeLessThanOrEqual(8);
  });

  it("scale is clamped at MIN_SCALE (0.1) — repeated wheel-down cannot go below it", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const svg = container.querySelector("svg")!;

    act(() => {
      for (let i = 0; i < 50; i++) {
        svg.dispatchEvent(
          new WheelEvent("wheel", { deltaY: 5000, clientX: 400, clientY: 300, bubbles: true })
        );
      }
    });

    expect(getTransform(container).scale).toBeGreaterThanOrEqual(0.1);
  });

  it("zoom changes both scale and translate (zoom-around-cursor moves the origin)", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const svg = container.querySelector("svg")!;

    const before = getTransform(container);

    act(() => {
      svg.dispatchEvent(
        new WheelEvent("wheel", { deltaY: -200, clientX: 400, clientY: 300, bubbles: true })
      );
    });

    const after = getTransform(container);

    // Scale must increase
    expect(after.scale).toBeGreaterThan(before.scale);
    // Translate must also change — zooming around a non-origin cursor moves the origin
    expect(after.x).not.toBeCloseTo(before.x);
  });
});

// ---------------------------------------------------------------------------
// Deselect
// ---------------------------------------------------------------------------

describe("Canvas — deselect", () => {
  it("calls onDeselect on mousedown+mouseup without drag on SVG background", () => {
    const onDeselect = vi.fn();
    const { container } = render(<Canvas page={PAGE} onDeselect={onDeselect} />);
    const svg = container.querySelector("svg")!;
    // Same position for mousedown and mouseup = click, not a rubber-band drag
    fireEvent.mouseDown(svg, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.mouseUp(svg, { button: 0, clientX: 100, clientY: 100 });
    expect(onDeselect).toHaveBeenCalledOnce();
  });

  it("does not call onDeselect when no handler is provided", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const svg = container.querySelector("svg")!;
    expect(() => {
      fireEvent.mouseDown(svg, { button: 0, clientX: 100, clientY: 100 });
      fireEvent.mouseUp(svg, { button: 0, clientX: 100, clientY: 100 });
    }).not.toThrow();
  });

  it("calls onRubberBandSelect when mouse is dragged more than 4px", () => {
    const onRubberBandSelect = vi.fn();
    const { container } = render(<Canvas page={PAGE} onRubberBandSelect={onRubberBandSelect} />);
    const svg = container.querySelector("svg")!;
    fireEvent.mouseDown(svg, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.mouseMove(svg, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(svg, { button: 0, clientX: 200, clientY: 200 });
    expect(onRubberBandSelect).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Pan (middle-mouse drag)
// ---------------------------------------------------------------------------

describe("Canvas — pan", () => {
  it("middle-mouse drag translates the canvas", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const svg = container.querySelector("svg")!;

    const before = getTransform(container);

    act(() => {
      svg.dispatchEvent(
        new MouseEvent("mousedown", { button: 1, clientX: 100, clientY: 100, bubbles: true })
      );
      svg.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 200, clientY: 150, bubbles: true })
      );
      svg.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    const after = getTransform(container);
    expect(after.x).toBeCloseTo(before.x + 100);
    expect(after.y).toBeCloseTo(before.y + 50);
  });

  it("left-mouse drag without space does NOT pan", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const svg = container.querySelector("svg")!;

    const before = getTransform(container);

    act(() => {
      svg.dispatchEvent(
        new MouseEvent("mousedown", { button: 0, clientX: 100, clientY: 100, bubbles: true })
      );
      svg.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 200, clientY: 150, bubbles: true })
      );
      svg.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    const after = getTransform(container);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it("mouseleave ends an active drag — further moves do not translate", () => {
    const { container } = render(<Canvas page={PAGE} />);
    const svg = container.querySelector("svg")!;

    act(() => {
      svg.dispatchEvent(
        new MouseEvent("mousedown", { button: 1, clientX: 100, clientY: 100, bubbles: true })
      );
      svg.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 150, clientY: 125, bubbles: true })
      );
    });

    // Use fireEvent so React's synthetic onMouseLeave handler fires correctly
    fireEvent.mouseLeave(svg);

    const after = getTransform(container);

    act(() => {
      // Move after leave should be a no-op — dragging.current is false
      svg.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 999, clientY: 999, bubbles: true })
      );
    });

    const afterLeave = getTransform(container);
    expect(afterLeave.x).toBeCloseTo(after.x);
    expect(afterLeave.y).toBeCloseTo(after.y);
  });
});
