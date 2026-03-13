import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ConnectorStyleEditor } from "./ConnectorStyleEditor.js";
import { DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";

describe("ConnectorStyleEditor", () => {
  it("renders stroke color input", () => {
    const { container } = render(
      <ConnectorStyleEditor style={{ ...DEFAULT_CONNECTOR_STYLE }} onChange={vi.fn()} />
    );
    expect(container.querySelector('input[type="color"]')).toBeTruthy();
  });

  it("calls onChange with strokeWidth patch", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ConnectorStyleEditor style={{ ...DEFAULT_CONNECTOR_STYLE }} onChange={onChange} />
    );
    const numInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(numInput, { target: { value: "3" } });
    expect(onChange).toHaveBeenCalledWith({ strokeWidth: 3 });
  });

  it("calls onChange with valid strokeDash", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ConnectorStyleEditor style={{ ...DEFAULT_CONNECTOR_STYLE }} onChange={onChange} />
    );
    const selects = container.querySelectorAll("select");
    fireEvent.change(selects[0]!, { target: { value: "dashed" } });
    expect(onChange).toHaveBeenCalledWith({ strokeDash: "dashed" });
  });

  it("ignores invalid strokeDash values", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ConnectorStyleEditor style={{ ...DEFAULT_CONNECTOR_STYLE }} onChange={onChange} />
    );
    const selects = container.querySelectorAll("select");
    fireEvent.change(selects[0]!, { target: { value: "wavy" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange with valid arrowStart", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ConnectorStyleEditor style={{ ...DEFAULT_CONNECTOR_STYLE }} onChange={onChange} />
    );
    const selects = container.querySelectorAll("select");
    fireEvent.change(selects[1]!, { target: { value: "open" } });
    expect(onChange).toHaveBeenCalledWith({ arrowStart: "open" });
  });

  it("ignores invalid arrowStart values", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ConnectorStyleEditor style={{ ...DEFAULT_CONNECTOR_STYLE }} onChange={onChange} />
    );
    const selects = container.querySelectorAll("select");
    fireEvent.change(selects[1]!, { target: { value: "double" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange with valid arrowEnd", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ConnectorStyleEditor style={{ ...DEFAULT_CONNECTOR_STYLE }} onChange={onChange} />
    );
    const selects = container.querySelectorAll("select");
    fireEvent.change(selects[2]!, { target: { value: "filled" } });
    expect(onChange).toHaveBeenCalledWith({ arrowEnd: "filled" });
  });

  it("ignores invalid arrowEnd values", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ConnectorStyleEditor style={{ ...DEFAULT_CONNECTOR_STYLE }} onChange={onChange} />
    );
    const selects = container.querySelectorAll("select");
    fireEvent.change(selects[2]!, { target: { value: "block" } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
