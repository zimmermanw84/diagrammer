import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImportButton } from "./ImportButton.js";
import { DiagramProvider } from "../state/index.js";

function renderButton(disabled?: boolean) {
  return render(
    <DiagramProvider>
      <ImportButton disabled={disabled} />
    </DiagramProvider>
  );
}

function makeVsdxFile(name = "test.vsdx") {
  return new File(["fake-vsdx-content"], name, { type: "application/vnd.ms-visio.drawing" });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetchOk(document = { pages: [{ id: "p1", name: "Page 1", width: 11, height: 8.5, shapes: [], connectors: [] }], meta: { title: "Imported", author: "", description: "" }, styleSheet: { namedStyles: {} } }) {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => document,
  });
}

function mockFetchError(status = 422, message = "Invalid file") {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: message }),
  });
}

describe("ImportButton", () => {
  it("renders the import button", () => {
    renderButton();
    expect(screen.getByRole("button", { name: /import \.vsdx/i })).toBeTruthy();
  });

  it("is disabled when the disabled prop is true", () => {
    renderButton(true);
    const btn = screen.getByRole("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("shows loading state while fetching", async () => {
    let resolve!: (v: unknown) => void;
    (fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((r) => { resolve = r; })
    );

    renderButton();
    const input = screen.getByLabelText("Import .vsdx file") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeVsdxFile()] } });

    await waitFor(() => expect(screen.getByText("Importing…")).toBeTruthy());

    resolve({ ok: true, json: async () => ({ pages: [{ id: "p1", name: "Page 1", width: 11, height: 8.5, shapes: [], connectors: [] }], meta: { title: "", author: "", description: "" }, styleSheet: { namedStyles: {} } }) });
  });

  it("dispatches LOAD_DOCUMENT on success", async () => {
    mockFetchOk();
    renderButton();
    const input = screen.getByLabelText("Import .vsdx file") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeVsdxFile()] } });

    await waitFor(() => expect(screen.getByText("Import .vsdx")).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/import/vsdx"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("shows an error toast on failure", async () => {
    mockFetchError(422, "Corrupt file");
    renderButton();
    const input = screen.getByLabelText("Import .vsdx file") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeVsdxFile()] } });

    await waitFor(() => expect(screen.getByText("Corrupt file")).toBeTruthy());
  });

  it("dismisses the error toast on click", async () => {
    mockFetchError(500, "Server error");
    renderButton();
    const input = screen.getByLabelText("Import .vsdx file") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeVsdxFile()] } });

    await waitFor(() => screen.getByText("Server error"));
    fireEvent.click(screen.getByText("Server error"));
    expect(screen.queryByText("Server error")).toBeNull();
  });

  it("shows error toast when fetch rejects with a network error", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderButton();
    const input = screen.getByLabelText("Import .vsdx file") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeVsdxFile()] } });

    await waitFor(() => expect(screen.getByText("Failed to fetch")).toBeTruthy());
  });

  it("re-enables the button after the request completes", async () => {
    mockFetchOk();
    renderButton();
    const btn = screen.getByRole("button") as HTMLButtonElement;
    const input = screen.getByLabelText("Import .vsdx file") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeVsdxFile()] } });

    await waitFor(() => expect(btn.disabled).toBe(false));
  });
});
