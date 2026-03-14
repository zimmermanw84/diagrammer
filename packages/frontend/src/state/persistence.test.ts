import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { loadSavedDocument, usePersistence, STORAGE_KEY } from "./persistence.js";
import { createEmptyDocument } from "@diagrammer/shared";

// Minimal localStorage mock
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });
  localStorageMock.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("loadSavedDocument", () => {
  it("returns null when nothing is stored", () => {
    expect(loadSavedDocument()).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    store[STORAGE_KEY] = "not-json{{{";
    expect(loadSavedDocument()).toBeNull();
  });

  it("returns null when stored data fails schema validation", () => {
    store[STORAGE_KEY] = JSON.stringify({ invalid: true });
    expect(loadSavedDocument()).toBeNull();
  });

  it("returns the parsed document when valid", () => {
    const doc = createEmptyDocument("Saved", "Author");
    store[STORAGE_KEY] = JSON.stringify(doc);
    const result = loadSavedDocument();
    expect(result).not.toBeNull();
    expect(result!.meta.title).toBe("Saved");
  });
});

describe("loadSavedDocument (extended)", () => {
  it("returns null for partially malformed data (wrong type on one field)", () => {
    const doc = createEmptyDocument("Partial", "Me");
    // createdAt must be a string (ISO date); setting it to a number should fail schema
    const malformed = { ...doc, meta: { ...doc.meta, createdAt: 123 } };
    store[STORAGE_KEY] = JSON.stringify(malformed);
    expect(loadSavedDocument()).toBeNull();
  });
});

describe("usePersistence", () => {
  it("saves the document to localStorage after debounce", async () => {
    const doc = createEmptyDocument("Test", "Me");
    const { result } = renderHook(() => usePersistence(doc));

    expect(store[STORAGE_KEY]).toBeUndefined();

    // Advance past debounce
    await act(async () => { vi.advanceTimersByTime(300); });

    expect(store[STORAGE_KEY]).toBeDefined();
    const saved = JSON.parse(store[STORAGE_KEY]!);
    expect(saved.meta.title).toBe("Test");
    expect(result.current.saveError).toBe(false);
  });

  it("returns saveError=true when localStorage.setItem throws (B3 regression)", async () => {
    vi.spyOn(localStorageMock, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const doc = createEmptyDocument("Throws", "Me");
    const { result } = renderHook(() => usePersistence(doc));

    expect(result.current.saveError).toBe(false);
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(result.current.saveError).toBe(true);
  });

  it("clears saveError when a subsequent save succeeds (B3 regression)", async () => {
    const setItem = vi.spyOn(localStorageMock, "setItem")
      .mockImplementationOnce(() => { throw new Error("QuotaExceededError"); });

    const doc1 = createEmptyDocument("Fail", "Me");
    const doc2 = createEmptyDocument("Succeed", "Me");
    const { result, rerender } = renderHook(({ doc }) => usePersistence(doc), {
      initialProps: { doc: doc1 },
    });

    await act(async () => { vi.advanceTimersByTime(300); });
    expect(result.current.saveError).toBe(true);

    setItem.mockRestore();
    rerender({ doc: doc2 });
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(result.current.saveError).toBe(false);
  });

  it("debounces: only the latest value is saved", async () => {
    const doc1 = createEmptyDocument("First", "Me");
    const doc2 = createEmptyDocument("Second", "Me");

    const { rerender } = renderHook(({ doc }) => usePersistence(doc), {
      initialProps: { doc: doc1 },
    });

    // Rerender before debounce fires
    rerender({ doc: doc2 });

    await act(async () => { vi.advanceTimersByTime(300); });

    const saved = JSON.parse(store[STORAGE_KEY]!);
    expect(saved.meta.title).toBe("Second");
  });
});
