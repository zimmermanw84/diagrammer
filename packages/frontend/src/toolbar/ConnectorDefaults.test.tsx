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

  it("renders stroke-dash toggle buttons for solid, dashed, dotted", () => {
    renderDefaults();
    expect(screen.getByTitle("solid")).toBeTruthy();
    expect(screen.getByTitle("dashed")).toBeTruthy();
    expect(screen.getByTitle("dotted")).toBeTruthy();
  });

  it("marks the current strokeDash as pressed", () => {
    render(<ConnectorDefaults style={{ ...DEFAULT_CONNECTOR_STYLE, strokeDash: "dashed" }} onChange={vi.fn()} />);
    const dashedBtn = screen.getByTitle("dashed") as HTMLButtonElement;
    expect(dashedBtn.getAttribute("aria-pressed")).toBe("true");
    const solidBtn = screen.getByTitle("solid") as HTMLButtonElement;
    expect(solidBtn.getAttribute("aria-pressed")).toBe("false");
  });

  it("calls onChange with strokeDash when a dash button is clicked", () => {
    const onChange = vi.fn();
    renderDefaults(onChange);
    fireEvent.click(screen.getByTitle("dashed"));
    expect(onChange).toHaveBeenCalledWith({ strokeDash: "dashed" });
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
