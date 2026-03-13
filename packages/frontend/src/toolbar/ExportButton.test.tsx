import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportButton } from "./ExportButton.js";
import { createEmptyDocument } from "@diagrammer/shared";

const doc = createEmptyDocument("My Diagram", "Tester");

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
  vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetchOk() {
  const blob = new Blob(["fake-vsdx"], { type: "application/vnd.ms-visio.drawing" });
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    blob: async () => blob,
  });
}

function mockFetchError(status = 422, message = "Invalid document") {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: message }),
  });
}

describe("ExportButton", () => {
  it("renders the export button", () => {
    render(<ExportButton doc={doc} />);
    expect(screen.getByRole("button", { name: /export to visio/i })).toBeTruthy();
  });

  it("is disabled when the disabled prop is true", () => {
    render(<ExportButton doc={doc} disabled />);
    const btn = screen.getByRole("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("shows loading state while fetching", async () => {
    let resolve!: (v: unknown) => void;
    (fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    render(<ExportButton doc={doc} />);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Exporting…")).toBeTruthy();

    // Resolve to avoid unhandled rejection
    resolve({ ok: true, blob: async () => new Blob() });
  });

  it("calls createObjectURL and revokeObjectURL on success", async () => {
    // Intercept anchor.click() to prevent happy-dom navigation
    const origCreate = window.document.createElement.bind(window.document);
    const clickSpy = vi.fn();
    vi.spyOn(window.document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const a = origCreate("a") as HTMLAnchorElement;
        vi.spyOn(a, "click").mockImplementation(clickSpy);
        return a;
      }
      return origCreate(tag);
    });

    mockFetchOk();
    render(<ExportButton doc={doc} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("shows an error toast on failure", async () => {
    mockFetchError(422, "Export failed — bad data");
    render(<ExportButton doc={doc} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByText("Export failed — bad data")).toBeTruthy());
  });

  it("dismisses the error toast on click", async () => {
    mockFetchError(500, "Server error");
    render(<ExportButton doc={doc} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => screen.getByText("Server error"));
    fireEvent.click(screen.getByText("Server error"));
    expect(screen.queryByText("Server error")).toBeNull();
  });

  it("re-enables the button after the request completes", async () => {
    mockFetchOk();
    render(<ExportButton doc={doc} />);
    const btn = screen.getByRole("button") as HTMLButtonElement;

    fireEvent.click(btn);
    await waitFor(() => expect(btn.disabled).toBe(false));
  });
});
