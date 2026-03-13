import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { StyleEditor } from "./StyleEditor.js";
import { DEFAULT_SHAPE_STYLE } from "@diagrammer/shared";

describe("StyleEditor", () => {
  it("renders fill color input", () => {
    const { container } = render(<StyleEditor style={{ ...DEFAULT_SHAPE_STYLE }} onChange={vi.fn()} />);
    const colorInputs = container.querySelectorAll('input[type="color"]');
    expect(colorInputs.length).toBeGreaterThan(0);
  });

  it("calls onChange with fillColor patch", () => {
    const onChange = vi.fn();
    const { container } = render(<StyleEditor style={{ ...DEFAULT_SHAPE_STYLE }} onChange={onChange} />);
    const fillInput = container.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(fillInput, { target: { value: "#ff0000" } });
    expect(onChange).toHaveBeenCalledWith({ fillColor: "#ff0000" });
  });

  it("calls onChange with strokeWidth patch", () => {
    const onChange = vi.fn();
    const { container } = render(<StyleEditor style={{ ...DEFAULT_SHAPE_STYLE }} onChange={onChange} />);
    const numInputs = container.querySelectorAll('input[type="number"]');
    fireEvent.change(numInputs[0]!, { target: { value: "3" } });
    expect(onChange).toHaveBeenCalledWith({ strokeWidth: 3 });
  });

  it("calls onChange with bold patch from checkbox", () => {
    const onChange = vi.fn();
    const { container } = render(<StyleEditor style={{ ...DEFAULT_SHAPE_STYLE }} onChange={onChange} />);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[0]!);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ bold: expect.any(Boolean) }));
  });

  it("calls onChange with textAlign from select", () => {
    const onChange = vi.fn();
    const { container } = render(<StyleEditor style={{ ...DEFAULT_SHAPE_STYLE }} onChange={onChange} />);
    const selects = container.querySelectorAll("select");
    // Last select is textAlign
    const textAlignSelect = selects[selects.length - 1]!;
    fireEvent.change(textAlignSelect, { target: { value: "right" } });
    expect(onChange).toHaveBeenCalledWith({ textAlign: "right" });
  });

  it("ignores invalid strokeDash values", () => {
    const onChange = vi.fn();
    const { container } = render(<StyleEditor style={{ ...DEFAULT_SHAPE_STYLE }} onChange={onChange} />);
    const selects = container.querySelectorAll("select");
    const strokeDashSelect = selects[0]!;
    fireEvent.change(strokeDashSelect, { target: { value: "invalid-dash" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores invalid textAlign values", () => {
    const onChange = vi.fn();
    const { container } = render(<StyleEditor style={{ ...DEFAULT_SHAPE_STYLE }} onChange={onChange} />);
    const selects = container.querySelectorAll("select");
    const textAlignSelect = selects[selects.length - 1]!;
    fireEvent.change(textAlignSelect, { target: { value: "justify" } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
