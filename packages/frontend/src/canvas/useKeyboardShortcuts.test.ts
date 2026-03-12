import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts.js";
import { DEFAULT_SHAPE_STYLE, DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";
import type { DiagramShape, DiagramConnector } from "@diagrammer/shared";

function makeShape(id: string): DiagramShape {
  return { id, type: "rectangle", x: 0, y: 0, width: 1, height: 1, label: "", style: { ...DEFAULT_SHAPE_STYLE }, properties: {} };
}

function makeConnector(id: string): DiagramConnector {
  return { id, fromShapeId: "a", toShapeId: "b", label: "", style: { ...DEFAULT_CONNECTOR_STYLE }, routing: "straight" };
}

describe("useKeyboardShortcuts", () => {
  it("dispatches DELETE_SHAPE when Delete is pressed with a shape selected", () => {
    const dispatch = vi.fn();
    renderHook(() => useKeyboardShortcuts({
      selection: "s1",
      shapes: [makeShape("s1")],
      connectors: [],
      dispatch,
    }));
    fireEvent.keyDown(window, { key: "Delete" });
    expect(dispatch).toHaveBeenCalledWith({ type: "DELETE_SHAPE", payload: { id: "s1" } });
  });

  it("dispatches DELETE_CONNECTOR when Delete is pressed with a connector selected", () => {
    const dispatch = vi.fn();
    renderHook(() => useKeyboardShortcuts({
      selection: "c1",
      shapes: [],
      connectors: [makeConnector("c1")],
      dispatch,
    }));
    fireEvent.keyDown(window, { key: "Delete" });
    expect(dispatch).toHaveBeenCalledWith({ type: "DELETE_CONNECTOR", payload: { id: "c1" } });
  });

  it("dispatches on Backspace as well", () => {
    const dispatch = vi.fn();
    renderHook(() => useKeyboardShortcuts({
      selection: "s1",
      shapes: [makeShape("s1")],
      connectors: [],
      dispatch,
    }));
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(dispatch).toHaveBeenCalledWith({ type: "DELETE_SHAPE", payload: { id: "s1" } });
  });

  it("does nothing when selection is null", () => {
    const dispatch = vi.fn();
    renderHook(() => useKeyboardShortcuts({
      selection: null,
      shapes: [makeShape("s1")],
      connectors: [],
      dispatch,
    }));
    fireEvent.keyDown(window, { key: "Delete" });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
