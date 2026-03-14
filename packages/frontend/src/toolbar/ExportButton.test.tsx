import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportButton } from "./ExportButton.js";
import { createEmptyDocument, sanitizeFilename } from "@diagrammer/shared";

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

// Helper: intercept the <a> click created during export and capture its download attr
function spyOnAnchorClick() {
  const origCreate = window.document.createElement.bind(window.document);
  let capturedDownload = "";
  const clickSpy = vi.fn();
  vi.spyOn(window.document, "createElement").mockImplementation((tag: string) => {
    if (tag === "a") {
      const a = origCreate("a") as HTMLAnchorElement;
      vi.spyOn(a, "click").mockImplementation(() => {
        capturedDownload = a.download;
        clickSpy();
      });
      return a;
    }
    return origCreate(tag);
  });
  return { clickSpy, getDownload: () => capturedDownload };
}

describe("sanitizeFilename", () => {
  it("passes through a clean name", () => {
    expect(sanitizeFilename("my-diagram")).toBe("my-diagram");
  });

  it("replaces characters invalid in filenames with underscores", () => {
    expect(sanitizeFilename("report/2024:final")).toBe("report_2024_final");
  });

  it("replaces surrounding whitespace with underscores then strips them", () => {
    expect(sanitizeFilename("  hello  ")).toBe("hello");
  });

  it("falls back to 'diagram' for an empty result", () => {
    expect(sanitizeFilename("   ")).toBe("diagram");
    expect(sanitizeFilename("///")).toBe("diagram");
  });
});

describe("ExportButton", () => {
  it("renders the export button", () => {
    render(<ExportButton doc={doc} />);
    expect(screen.getByRole("button", { name: /export to visio/i })).toBeTruthy();
  });

  it("renders the filename input pre-populated with the sanitized document title", () => {
    render(<ExportButton doc={doc} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("My_Diagram");
  });

  it("sanitizes the document title for the initial filename value", () => {
    const dirtyDoc = { ...doc, meta: { ...doc.meta, title: "my:diagram/file" } };
    render(<ExportButton doc={dirtyDoc} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("my_diagram_file");
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

  it("uses the filename input value as the download attribute", async () => {
    const { clickSpy, getDownload } = spyOnAnchorClick();

    mockFetchOk();
    render(<ExportButton doc={doc} />);

    // Change the filename
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "my-export" } });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(getDownload()).toBe("my-export.vsdx");
  });

  it("sanitizes the filename before using it as the download attribute", async () => {
    const { clickSpy, getDownload } = spyOnAnchorClick();

    mockFetchOk();
    render(<ExportButton doc={doc} />);

    // Type an invalid filename
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "report/2024:final" } });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(getDownload()).toBe("report_2024_final.vsdx");
  });

  it("calls createObjectURL and revokeObjectURL on success", async () => {
    const { clickSpy } = spyOnAnchorClick();

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

  it("shows error toast when fetch rejects with a network error", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<ExportButton doc={doc} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByText("Failed to fetch")).toBeTruthy());
  });

  it("re-enables the button after the request completes", async () => {
    mockFetchOk();
    render(<ExportButton doc={doc} />);
    const btn = screen.getByRole("button") as HTMLButtonElement;

    fireEvent.click(btn);
    await waitFor(() => expect(btn.disabled).toBe(false));
  });
});
