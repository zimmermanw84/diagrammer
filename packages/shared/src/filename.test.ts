import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "./filename";

describe("sanitizeFilename", () => {
  it("passes through clean alphanumeric names", () => {
    expect(sanitizeFilename("diagram")).toBe("diagram");
    expect(sanitizeFilename("MyDiagram123")).toBe("MyDiagram123");
  });

  it("allows hyphens and underscores", () => {
    expect(sanitizeFilename("my-diagram")).toBe("my-diagram");
    expect(sanitizeFilename("my_diagram")).toBe("my_diagram");
  });

  it("replaces spaces with underscores", () => {
    expect(sanitizeFilename("my diagram")).toBe("my_diagram");
  });

  it("replaces characters invalid in filenames", () => {
    expect(sanitizeFilename('file/with\\slashes')).toBe("file_with_slashes");
    expect(sanitizeFilename('name:with*special?"<>|chars')).toBe("name_with_special_____chars");
  });

  it("strips leading and trailing underscores", () => {
    expect(sanitizeFilename("  diagram  ")).toBe("diagram");
    expect(sanitizeFilename("...diagram...")).toBe("diagram");
  });

  it("falls back to 'diagram' when result is empty", () => {
    expect(sanitizeFilename("")).toBe("diagram");
    expect(sanitizeFilename("???")).toBe("diagram");
    expect(sanitizeFilename("   ")).toBe("diagram");
  });
});
