import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";

describe("App", () => {
  it("renders the three-panel layout", () => {
    render(<App />);
    expect(screen.getByText("Toolbar")).toBeDefined();
    expect(screen.getByText("Canvas — T06")).toBeDefined();
    expect(screen.getByText("Properties")).toBeDefined();
  });
});
