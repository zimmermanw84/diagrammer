import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHealthCheck } from "./useHealthCheck.js";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function mockHealthOk() {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
}

function mockHealthFail() {
  (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));
}

describe("useHealthCheck", () => {
  it("starts as online and polls the health endpoint immediately", async () => {
    mockHealthOk();
    const { result } = renderHook(() => useHealthCheck());

    // Initial state is optimistically true
    expect(result.current.isOnline).toBe(true);

    // Let the initial fetch resolve
    await act(async () => { await Promise.resolve(); });
    expect(result.current.isOnline).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/health"),
      expect.any(Object)
    );
  });

  it("sets isOnline to false when the health check fails", async () => {
    mockHealthFail();
    const { result } = renderHook(() => useHealthCheck());

    await act(async () => { await Promise.resolve(); });
    expect(result.current.isOnline).toBe(false);
  });

  it("sets isOnline to false when the server returns non-ok", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useHealthCheck());

    await act(async () => { await Promise.resolve(); });
    expect(result.current.isOnline).toBe(false);
  });

  it("recovers to online when health check succeeds after failure", async () => {
    mockHealthFail();
    const { result } = renderHook(() => useHealthCheck());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.isOnline).toBe(false);

    // Next poll succeeds
    mockHealthOk();
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(result.current.isOnline).toBe(true);
  });

  it("polls on the 5-second interval", async () => {
    mockHealthOk();
    renderHook(() => useHealthCheck());

    await act(async () => { await Promise.resolve(); });
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("falls back gracefully when AbortSignal.timeout is not supported", async () => {
    const origTimeout = AbortSignal.timeout;
    // @ts-expect-error — simulating an environment that lacks AbortSignal.timeout
    AbortSignal.timeout = undefined;

    // fetch won't even be reached since AbortSignal.timeout() throws synchronously,
    // but the try/catch in the hook catches it and sets isOnline to false
    const { result } = renderHook(() => useHealthCheck());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.isOnline).toBe(false);

    AbortSignal.timeout = origTimeout;
  });

  it("stops polling after unmount", async () => {
    mockHealthOk();
    const { unmount } = renderHook(() => useHealthCheck());
    await act(async () => { await Promise.resolve(); });

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(10000);
      await Promise.resolve();
    });
    // Only the initial call, no more polls after unmount
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not update state after unmount even if fetch resolves late (B5 regression)", async () => {
    // Fetch resolves only after we explicitly resolve it
    let resolveFetch!: (v: unknown) => void;
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((r) => { resolveFetch = r; })
    );

    const { result, unmount } = renderHook(() => useHealthCheck());
    // Unmount before fetch resolves
    unmount();

    // Now resolve the fetch — state must NOT change (no React warning)
    await act(async () => {
      resolveFetch({ ok: true });
      await Promise.resolve();
    });

    // isOnline remains at initial optimistic value (true); no "setState on unmounted" error
    expect(result.current.isOnline).toBe(true);
  });
});
