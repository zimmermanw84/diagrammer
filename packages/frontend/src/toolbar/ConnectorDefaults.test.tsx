import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConnectorDefaults } from "./ConnectorDefaults.js";
import { DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";

function renderDefaults(onChange = vi.fn()) {
  return render(<ConnectorDefaults style={DEFAULT_CONNECTOR_STYLE} onChange={onChange} />);
}

describe("ConnectorDefaults", () => {
  it("renders the Connector heading", () => {
    renderDefaults();
    expect(screen.getByText("Connector")).toBeTruthy();
  });

  it("renders stroke-dash toggle buttons with descriptive tooltips", () => {
    renderDefaults();
    expect(screen.getByTitle("Solid line")).toBeTruthy();
    expect(screen.getByTitle("Dashed line")).toBeTruthy();
    expect(screen.getByTitle("Dotted line")).toBeTruthy();
  });

  it("marks the current strokeDash as pressed", () => {
    render(<ConnectorDefaults style={{ ...DEFAULT_CONNECTOR_STYLE, strokeDash: "dashed" }} onChange={vi.fn()} />);
    const dashedBtn = screen.getByTitle("Dashed line") as HTMLButtonElement;
    expect(dashedBtn.getAttribute("aria-pressed")).toBe("true");
    const solidBtn = screen.getByTitle("Solid line") as HTMLButtonElement;
    expect(solidBtn.getAttribute("aria-pressed")).toBe("false");
  });

  it("calls onChange with strokeDash when a dash button is clicked", () => {
    const onChange = vi.fn();
    renderDefaults(onChange);
    fireEvent.click(screen.getByTitle("Dashed line"));
    expect(onChange).toHaveBeenCalledWith({ strokeDash: "dashed" });
  });

  it("renders the arrow-start select with the current value", () => {
    render(<ConnectorDefaults style={{ ...DEFAULT_CONNECTOR_STYLE, arrowStart: "open" }} onChange={vi.fn()} />);
    const select = screen.getByLabelText("Arrow start") as HTMLSelectElement;
    expect(select.value).toBe("open");
  });

  it("calls onChange with arrowStart when arrow start select changes", () => {
    const onChange = vi.fn();
    renderDefaults(onChange);
    fireEvent.change(screen.getByLabelText("Arrow start"), { target: { value: "filled" } });
    expect(onChange).toHaveBeenCalledWith({ arrowStart: "filled" });
  });

  it("renders the arrow-end select with the current value", () => {
    render(<ConnectorDefaults style={{ ...DEFAULT_CONNECTOR_STYLE, arrowEnd: "open" }} onChange={vi.fn()} />);
    const select = screen.getByLabelText("Arrow end") as HTMLSelectElement;
    expect(select.value).toBe("open");
  });

  it("calls onChange with arrowEnd when arrow select changes", () => {
    const onChange = vi.fn();
    renderDefaults(onChange);
    fireEvent.change(screen.getByLabelText("Arrow end"), { target: { value: "filled" } });
    expect(onChange).toHaveBeenCalledWith({ arrowEnd: "filled" });
  });
});
