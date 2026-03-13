import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StylePresets } from "./StylePresets.js";
import type { StyleSheet } from "@diagrammer/shared";

const styleSheet: StyleSheet = {
  namedStyles: {
    "Blue": { fillColor: "#89b4fa", strokeColor: "#1e66f5" },
    "Dashed": { strokeDash: "dashed" },
    "Shadow": { shadow: true },
  },
};

describe("StylePresets", () => {
  it("renders a preset option for each named style", () => {
    render(<StylePresets styleSheet={styleSheet} onApply={vi.fn()} />);
    expect(screen.getByRole("option", { name: "Blue" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Dashed" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Shadow" })).toBeTruthy();
  });

  it("calls onApply with the matching partial style when a preset is selected", () => {
    const onApply = vi.fn();
    render(<StylePresets styleSheet={styleSheet} onApply={onApply} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Blue" } });
    expect(onApply).toHaveBeenCalledWith({ fillColor: "#89b4fa", strokeColor: "#1e66f5" });
  });

  it("calls onApply with shadow: true when Shadow preset is selected", () => {
    const onApply = vi.fn();
    render(<StylePresets styleSheet={styleSheet} onApply={onApply} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Shadow" } });
    expect(onApply).toHaveBeenCalledWith({ shadow: true });
  });

  it("renders nothing when namedStyles is empty", () => {
    const { container } = render(
      <StylePresets styleSheet={{ namedStyles: {} }} onApply={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});
