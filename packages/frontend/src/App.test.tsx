import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";

describe("App", () => {
  it("renders the three-panel layout", () => {
    render(<App />);
    expect(screen.getByText("Shapes")).toBeDefined();
    expect(document.querySelector("svg")).toBeDefined();
    expect(screen.getByText("Select a shape to edit its properties")).toBeDefined();
  });
});
