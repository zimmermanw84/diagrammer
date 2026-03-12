import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { CustomProperties } from "./CustomProperties.js";

describe("CustomProperties", () => {
  it("renders existing properties", () => {
    render(<CustomProperties properties={{ color: "red" }} onChange={vi.fn()} onDelete={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByDisplayValue("color")).toBeTruthy();
    expect(screen.getByDisplayValue("red")).toBeTruthy();
  });

  it("calls onChange when value changes", () => {
    const onChange = vi.fn();
    const { container } = render(<CustomProperties properties={{ color: "red" }} onChange={onChange} onDelete={vi.fn()} onAdd={vi.fn()} />);
    const inputs = container.querySelectorAll('input');
    // Second input is the value
    fireEvent.change(inputs[1]!, { target: { value: "blue" } });
    expect(onChange).toHaveBeenCalledWith("color", "blue");
  });

  it("calls onDelete when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<CustomProperties properties={{ color: "red" }} onChange={vi.fn()} onDelete={onDelete} onAdd={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Delete property"));
    expect(onDelete).toHaveBeenCalledWith("color");
  });

  it("calls onAdd when add button clicked", () => {
    const onAdd = vi.fn();
    render(<CustomProperties properties={{}} onChange={vi.fn()} onDelete={vi.fn()} onAdd={onAdd} />);
    fireEvent.click(screen.getByText("+ Add property"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("renders nothing when properties is empty", () => {
    const { container } = render(<CustomProperties properties={{}} onChange={vi.fn()} onDelete={vi.fn()} onAdd={vi.fn()} />);
    expect(container.querySelectorAll('input').length).toBe(0);
  });
});
