import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageTabBar } from "./PageTabBar.js";
import type { DiagramPage } from "@diagrammer/shared";

function makePage(id: string, name: string): DiagramPage {
  return { id, name, width: 11, height: 8.5, shapes: [], connectors: [] };
}

const pages = [makePage("p1", "Page 1"), makePage("p2", "Page 2")];

describe("PageTabBar", () => {
  it("renders a tab for each page", () => {
    render(
      <PageTabBar
        pages={pages}
        activePageId="p1"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText("Page 1")).toBeTruthy();
    expect(screen.getByText("Page 2")).toBeTruthy();
  });

  it("marks the active tab with aria-selected=true", () => {
    render(
      <PageTabBar
        pages={pages}
        activePageId="p2"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  });

  it("calls onSelect when a tab is clicked", () => {
    const onSelect = vi.fn();
    render(
      <PageTabBar
        pages={pages}
        activePageId="p1"
        onSelect={onSelect}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Page 2"));
    expect(onSelect).toHaveBeenCalledWith("p2");
  });

  it("calls onAdd when the + button is clicked", () => {
    const onAdd = vi.fn();
    render(
      <PageTabBar
        pages={pages}
        activePageId="p1"
        onSelect={vi.fn()}
        onAdd={onAdd}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /add page/i }));
    expect(onAdd).toHaveBeenCalled();
  });

  it("shows context menu on right-click with Rename and Delete options", () => {
    render(
      <PageTabBar
        pages={pages}
        activePageId="p1"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.contextMenu(screen.getByText("Page 1"));
    expect(screen.getByText("Rename")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("calls onDelete when Delete is clicked in the context menu", () => {
    const onDelete = vi.fn();
    render(
      <PageTabBar
        pages={pages}
        activePageId="p1"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.contextMenu(screen.getByText("Page 1"));
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("p1");
  });

  it("disables Delete in the context menu when only one page exists", () => {
    render(
      <PageTabBar
        pages={[makePage("p1", "Page 1")]}
        activePageId="p1"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.contextMenu(screen.getByText("Page 1"));
    const deleteBtn = screen.getByText("Delete") as HTMLButtonElement;
    expect(deleteBtn.disabled).toBe(true);
  });

  it("shows rename input when Rename is clicked in the context menu", () => {
    render(
      <PageTabBar
        pages={pages}
        activePageId="p1"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.contextMenu(screen.getByText("Page 1"));
    fireEvent.click(screen.getByText("Rename"));
    // Tab label replaced by input pre-filled with current name
    expect(screen.getByDisplayValue("Page 1")).toBeTruthy();
  });

  it("calls onRename with new name on Enter", () => {
    const onRename = vi.fn();
    render(
      <PageTabBar
        pages={pages}
        activePageId="p1"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={onRename}
        onDelete={vi.fn()}
      />
    );
    fireEvent.contextMenu(screen.getByText("Page 1"));
    fireEvent.click(screen.getByText("Rename"));

    const input = screen.getByDisplayValue("Page 1");
    fireEvent.change(input, { target: { value: "Renamed Page" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onRename).toHaveBeenCalledWith("p1", "Renamed Page");
  });

  it("cancels rename on Escape without calling onRename", () => {
    const onRename = vi.fn();
    render(
      <PageTabBar
        pages={pages}
        activePageId="p1"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={onRename}
        onDelete={vi.fn()}
      />
    );
    fireEvent.contextMenu(screen.getByText("Page 1"));
    fireEvent.click(screen.getByText("Rename"));

    const input = screen.getByDisplayValue("Page 1");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onRename).not.toHaveBeenCalled();
  });
});
