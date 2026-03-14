import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGlobalMouseDrag } from "./useGlobalMouseDrag.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useGlobalMouseDrag", () => {
  it("registers mousemove and mouseup on window when startDrag is called", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const { result } = renderHook(() => useGlobalMouseDrag());

    act(() => { result.current(vi.fn(), vi.fn()); });

    expect(addSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));
  });

  it("calls onMove with the event when mousemove fires after startDrag", () => {
    const { result } = renderHook(() => useGlobalMouseDrag());
    const onMove = vi.fn();

    act(() => { result.current(onMove, vi.fn()); });
    window.dispatchEvent(new MouseEvent("mousemove"));

    expect(onMove).toHaveBeenCalledOnce();
  });

  it("calls onUp with the event when mouseup fires", () => {
    const { result } = renderHook(() => useGlobalMouseDrag());
    const onUp = vi.fn();

    act(() => { result.current(vi.fn(), onUp); });
    window.dispatchEvent(new MouseEvent("mouseup"));

    expect(onUp).toHaveBeenCalledOnce();
  });

  it("removes both listeners from window after mouseup", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { result } = renderHook(() => useGlobalMouseDrag());

    act(() => { result.current(vi.fn(), vi.fn()); });
    window.dispatchEvent(new MouseEvent("mouseup"));

    expect(removeSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));
  });

  it("does not call onMove after mouseup fires", () => {
    const { result } = renderHook(() => useGlobalMouseDrag());
    const onMove = vi.fn();

    act(() => { result.current(onMove, vi.fn()); });
    window.dispatchEvent(new MouseEvent("mouseup"));
    window.dispatchEvent(new MouseEvent("mousemove")); // should be a no-op

    expect(onMove).not.toHaveBeenCalled();
  });

  it("does not call onMove before startDrag is called", () => {
    const { result } = renderHook(() => useGlobalMouseDrag());
    const onMove = vi.fn();

    // Never call result.current(...)
    window.dispatchEvent(new MouseEvent("mousemove"));

    expect(onMove).not.toHaveBeenCalled();
  });

  it("returns a stable startDrag reference across re-renders", () => {
    const { result, rerender } = renderHook(() => useGlobalMouseDrag());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("supports multiple independent drag sessions sequentially", () => {
    const { result } = renderHook(() => useGlobalMouseDrag());
    const onMove1 = vi.fn();
    const onMove2 = vi.fn();

    // First session
    act(() => { result.current(onMove1, vi.fn()); });
    window.dispatchEvent(new MouseEvent("mousemove"));
    window.dispatchEvent(new MouseEvent("mouseup"));

    // Second session
    act(() => { result.current(onMove2, vi.fn()); });
    window.dispatchEvent(new MouseEvent("mousemove"));
    window.dispatchEvent(new MouseEvent("mouseup"));

    expect(onMove1).toHaveBeenCalledOnce();
    expect(onMove2).toHaveBeenCalledOnce();
  });
});
