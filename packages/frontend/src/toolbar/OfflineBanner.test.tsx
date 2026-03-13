import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfflineBanner } from "./OfflineBanner.js";

describe("OfflineBanner", () => {
  it("renders the offline message", () => {
    render(<OfflineBanner />);
    expect(screen.getByText(/backend offline/i)).toBeTruthy();
  });
});
