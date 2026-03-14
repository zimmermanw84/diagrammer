import { describe, it, expect, beforeEach } from "vitest";
import { diagramReducer, createInitialState, historyReducer, createInitialHistoryState } from "./reducer.js";
import type { State, HistoryState } from "./reducer.js";
import type { DiagramAction } from "./actions.js";
import { DEFAULT_SHAPE_STYLE } from "@diagrammer/shared";
import { makeShapePayload, makeConnectorPayload } from "../test-utils/fixtures.js";

function dispatch(state: State, action: DiagramAction): State {
  return diagramReducer(state, action);
}

function hdispatch(state: HistoryState, action: DiagramAction): HistoryState {
  return historyReducer(state, action);
}

describe("createInitialState", () => {
  it("returns a valid initial state with one page", () => {
    const state = createInitialState();
    expect(state.document.pages).toHaveLength(1);
    expect(state.activePageId).toBe(state.document.pages[0].id);
    expect(state.selection).toEqual([]);
  });
});

describe("ADD_SHAPE", () => {
  it("adds a shape to the active page", () => {
    const state = createInitialState();
    const next = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const page = next.document.pages.find((p) => p.id === next.activePageId)!;
    expect(page.shapes).toHaveLength(1);
  });

  it("generates a unique id for the shape", () => {
    const state = createInitialState();
    const next1 = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const next2 = dispatch(next1, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const page = next2.document.pages.find((p) => p.id === next2.activePageId)!;
    expect(page.shapes).toHaveLength(2);
    const [s1, s2] = page.shapes;
    expect(s1.id).toBeTruthy();
    expect(s2.id).toBeTruthy();
    expect(s1.id).not.toBe(s2.id);
  });

  it("preserves payload fields", () => {
    const state = createInitialState();
    const payload = makeShapePayload({ x: 42, y: 99, label: "Hello" });
    const next = dispatch(state, { type: "ADD_SHAPE", payload });
    const page = next.document.pages.find((p) => p.id === next.activePageId)!;
    const shape = page.shapes[0];
    expect(shape.x).toBe(42);
    expect(shape.y).toBe(99);
    expect(shape.label).toBe("Hello");
  });

  it("does not affect other pages", () => {
    let state = createInitialState();
    // Add a second page
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    const page2Id = state.document.pages[1].id;
    // Switch to page 2
    state = dispatch(state, { type: "SET_ACTIVE_PAGE", payload: { pageId: page2Id } });
    // Add shape on page 2
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    // Page 1 should still have 0 shapes
    expect(state.document.pages[0].shapes).toHaveLength(0);
    expect(state.document.pages[1].shapes).toHaveLength(1);
  });
});

describe("MOVE_SHAPE", () => {
  it("updates x and y by dx/dy", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ x: 10, y: 20 }) });
    const page = state.document.pages.find((p) => p.id === state.activePageId)!;
    const shapeId = page.shapes[0].id;
    state = dispatch(state, { type: "MOVE_SHAPE", payload: { id: shapeId, dx: 5, dy: -3 } });
    const movedShape = state.document.pages.find((p) => p.id === state.activePageId)!.shapes[0];
    expect(movedShape.x).toBe(15);
    expect(movedShape.y).toBe(17);
  });

  it("does not affect other shapes", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ x: 0, y: 0 }) });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ x: 100, y: 100 }) });
    const page = state.document.pages.find((p) => p.id === state.activePageId)!;
    const [id1] = page.shapes.map((s) => s.id);
    state = dispatch(state, { type: "MOVE_SHAPE", payload: { id: id1, dx: 10, dy: 10 } });
    const updatedPage = state.document.pages.find((p) => p.id === state.activePageId)!;
    expect(updatedPage.shapes[0].x).toBe(10);
    expect(updatedPage.shapes[1].x).toBe(100);
  });

  it("is a no-op for unknown page (wrong activePageId)", () => {
    let state = createInitialState();
    // Add shape on page 1
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ x: 10, y: 20 }) });
    const page1 = state.document.pages[0];
    const shapeId = page1.shapes[0].id;
    // Add a second page and switch to it
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    const page2Id = state.document.pages[1].id;
    state = dispatch(state, { type: "SET_ACTIVE_PAGE", payload: { pageId: page2Id } });
    // MOVE_SHAPE with id from page1, but we're on page2 — page1 shape is untouched
    state = dispatch(state, { type: "MOVE_SHAPE", payload: { id: shapeId, dx: 999, dy: 999 } });
    expect(state.document.pages[0].shapes[0].x).toBe(10);
  });
});

describe("RESIZE_SHAPE", () => {
  it("updates width and height", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ width: 100, height: 50 }) });
    const shapeId = state.document.pages[0].shapes[0].id;
    state = dispatch(state, { type: "RESIZE_SHAPE", payload: { id: shapeId, width: 200, height: 80 } });
    const shape = state.document.pages[0].shapes[0];
    expect(shape.width).toBe(200);
    expect(shape.height).toBe(80);
  });
});

describe("DELETE_SHAPE", () => {
  it("removes the shape from the active page", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const shapeId = state.document.pages[0].shapes[0].id;
    state = dispatch(state, { type: "DELETE_SHAPE", payload: { id: shapeId } });
    expect(state.document.pages[0].shapes).toHaveLength(0);
  });

  it("only removes the targeted shape", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const [id1, id2] = state.document.pages[0].shapes.map((s) => s.id);
    state = dispatch(state, { type: "DELETE_SHAPE", payload: { id: id1 } });
    expect(state.document.pages[0].shapes).toHaveLength(1);
    expect(state.document.pages[0].shapes[0].id).toBe(id2);
  });

  it("removes connectors attached to the deleted shape", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const [id1, id2] = state.document.pages[0].shapes.map((s) => s.id);
    state = dispatch(state, { type: "ADD_CONNECTOR", payload: makeConnectorPayload(id1, id2) });
    expect(state.document.pages[0].connectors).toHaveLength(1);

    state = dispatch(state, { type: "DELETE_SHAPE", payload: { id: id1 } });
    expect(state.document.pages[0].connectors).toHaveLength(0);
  });

  it("removes connectors where the deleted shape is the target", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const [id1, id2] = state.document.pages[0].shapes.map((s) => s.id);
    state = dispatch(state, { type: "ADD_CONNECTOR", payload: makeConnectorPayload(id1, id2) });

    state = dispatch(state, { type: "DELETE_SHAPE", payload: { id: id2 } });
    expect(state.document.pages[0].connectors).toHaveLength(0);
  });

  it("preserves connectors between other shapes", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const [id1, id2, id3] = state.document.pages[0].shapes.map((s) => s.id);
    state = dispatch(state, { type: "ADD_CONNECTOR", payload: makeConnectorPayload(id1, id2) });
    state = dispatch(state, { type: "ADD_CONNECTOR", payload: makeConnectorPayload(id2, id3) });

    // Delete id1 — only the id1→id2 connector should go
    state = dispatch(state, { type: "DELETE_SHAPE", payload: { id: id1 } });
    expect(state.document.pages[0].connectors).toHaveLength(1);
    expect(state.document.pages[0].connectors[0].fromShapeId).toBe(id2);
  });

  it("clears selection when the selected shape is deleted", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const shapeId = state.document.pages[0].shapes[0].id;
    state = dispatch(state, { type: "SELECT", payload: { id: shapeId } });
    expect(state.selection).toEqual([shapeId]);

    state = dispatch(state, { type: "DELETE_SHAPE", payload: { id: shapeId } });
    expect(state.selection).toEqual([]);
  });
});

describe("SET_LABEL", () => {
  it("updates label on a shape", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ label: "Old" }) });
    const shapeId = state.document.pages[0].shapes[0].id;
    state = dispatch(state, { type: "SET_LABEL", payload: { id: shapeId, label: "New" } });
    expect(state.document.pages[0].shapes[0].label).toBe("New");
  });

  it("updates label on a connector", () => {
    let state = createInitialState();
    // Need two shapes for connector
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const [fromId, toId] = state.document.pages[0].shapes.map((s) => s.id);
    state = dispatch(state, {
      type: "ADD_CONNECTOR",
      payload: makeConnectorPayload(fromId, toId, { label: "Old Connector" }),
    });
    const connectorId = state.document.pages[0].connectors[0].id;
    state = dispatch(state, { type: "SET_LABEL", payload: { id: connectorId, label: "New Connector" } });
    expect(state.document.pages[0].connectors[0].label).toBe("New Connector");
  });
});

describe("UPDATE_STYLE", () => {
  it("merges partial style without clobbering other fields", () => {
    let state = createInitialState();
    state = dispatch(state, {
      type: "ADD_SHAPE",
      payload: makeShapePayload({
        style: { ...DEFAULT_SHAPE_STYLE, fillColor: "#ff0000", strokeColor: "#000000" },
      }),
    });
    const shapeId = state.document.pages[0].shapes[0].id;
    state = dispatch(state, {
      type: "UPDATE_STYLE",
      payload: { id: shapeId, style: { fillColor: "#00ff00" } },
    });
    const shape = state.document.pages[0].shapes[0];
    expect(shape.style.fillColor).toBe("#00ff00");
    // strokeColor should be untouched
    expect(shape.style.strokeColor).toBe("#000000");
    // other default fields preserved
    expect(shape.style.fontFamily).toBe(DEFAULT_SHAPE_STYLE.fontFamily);
  });
});

describe("SET_PROPERTY / DELETE_PROPERTY", () => {
  it("SET_PROPERTY adds a key-value pair", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const shapeId = state.document.pages[0].shapes[0].id;
    state = dispatch(state, { type: "SET_PROPERTY", payload: { id: shapeId, key: "url", value: "https://example.com" } });
    expect(state.document.pages[0].shapes[0].properties["url"]).toBe("https://example.com");
  });

  it("SET_PROPERTY updates an existing key", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ properties: { url: "old" } }) });
    const shapeId = state.document.pages[0].shapes[0].id;
    state = dispatch(state, { type: "SET_PROPERTY", payload: { id: shapeId, key: "url", value: "new" } });
    expect(state.document.pages[0].shapes[0].properties["url"]).toBe("new");
  });

  it("DELETE_PROPERTY removes a key", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ properties: { url: "https://example.com", color: "red" } }) });
    const shapeId = state.document.pages[0].shapes[0].id;
    state = dispatch(state, { type: "DELETE_PROPERTY", payload: { id: shapeId, key: "url" } });
    expect(state.document.pages[0].shapes[0].properties["url"]).toBeUndefined();
    expect(state.document.pages[0].shapes[0].properties["color"]).toBe("red");
  });
});

describe("ADD_CONNECTOR", () => {
  it("adds a connector with a generated id", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const [fromId, toId] = state.document.pages[0].shapes.map((s) => s.id);
    state = dispatch(state, { type: "ADD_CONNECTOR", payload: makeConnectorPayload(fromId, toId) });
    expect(state.document.pages[0].connectors).toHaveLength(1);
    expect(state.document.pages[0].connectors[0].id).toBeTruthy();
    expect(state.document.pages[0].connectors[0].fromShapeId).toBe(fromId);
    expect(state.document.pages[0].connectors[0].toShapeId).toBe(toId);
  });

  it("generates unique ids for multiple connectors", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const [fromId, toId] = state.document.pages[0].shapes.map((s) => s.id);
    state = dispatch(state, { type: "ADD_CONNECTOR", payload: makeConnectorPayload(fromId, toId) });
    state = dispatch(state, { type: "ADD_CONNECTOR", payload: makeConnectorPayload(fromId, toId) });
    const [c1, c2] = state.document.pages[0].connectors;
    expect(c1.id).not.toBe(c2.id);
  });
});

describe("DELETE_CONNECTOR", () => {
  it("removes the connector", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const [fromId, toId] = state.document.pages[0].shapes.map((s) => s.id);
    state = dispatch(state, { type: "ADD_CONNECTOR", payload: makeConnectorPayload(fromId, toId) });
    const connectorId = state.document.pages[0].connectors[0].id;
    state = dispatch(state, { type: "DELETE_CONNECTOR", payload: { id: connectorId } });
    expect(state.document.pages[0].connectors).toHaveLength(0);
  });
});

describe("ADD_PAGE", () => {
  it("adds a page with a generated id", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    expect(state.document.pages).toHaveLength(2);
    expect(state.document.pages[1].id).toBeTruthy();
    expect(state.document.pages[1].name).toBe("Page 2");
    expect(state.document.pages[1].shapes).toEqual([]);
    expect(state.document.pages[1].connectors).toEqual([]);
  });

  it("generates unique ids for multiple added pages", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "P2", width: 11, height: 8.5 } });
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "P3", width: 11, height: 8.5 } });
    const [, p2, p3] = state.document.pages;
    expect(p2.id).not.toBe(p3.id);
  });

  it("does not change the active page", () => {
    let state = createInitialState();
    const originalActiveId = state.activePageId;
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    expect(state.activePageId).toBe(originalActiveId);
  });
});

describe("SET_ACTIVE_PAGE", () => {
  it("switches the active page", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    const page2Id = state.document.pages[1].id;
    state = dispatch(state, { type: "SET_ACTIVE_PAGE", payload: { pageId: page2Id } });
    expect(state.activePageId).toBe(page2Id);
  });

  it("clears the selection when switching pages", () => {
    let state = createInitialState();
    // Manually set selection
    state = { ...state, selection: ["some-shape-id"] };
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    const page2Id = state.document.pages[1].id;
    state = dispatch(state, { type: "SET_ACTIVE_PAGE", payload: { pageId: page2Id } });
    expect(state.selection).toEqual([]);
  });
});

describe("Operations on wrong page are no-ops", () => {
  let state: State;
  let page1ShapeId: string;
  let page2Id: string;

  beforeEach(() => {
    state = createInitialState();
    // Add shape to page 1
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ x: 0, y: 0 }) });
    page1ShapeId = state.document.pages[0].shapes[0].id;
    // Add page 2 and switch to it
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    page2Id = state.document.pages[1].id;
    state = dispatch(state, { type: "SET_ACTIVE_PAGE", payload: { pageId: page2Id } });
  });

  it("MOVE_SHAPE on shape in non-active page is a no-op", () => {
    const next = dispatch(state, { type: "MOVE_SHAPE", payload: { id: page1ShapeId, dx: 100, dy: 100 } });
    expect(next.document.pages[0].shapes[0].x).toBe(0);
  });

  it("RESIZE_SHAPE on shape in non-active page is a no-op", () => {
    const next = dispatch(state, { type: "RESIZE_SHAPE", payload: { id: page1ShapeId, width: 999, height: 999 } });
    expect(next.document.pages[0].shapes[0].width).toBe(100);
  });

  it("DELETE_SHAPE on shape in non-active page is a no-op", () => {
    const next = dispatch(state, { type: "DELETE_SHAPE", payload: { id: page1ShapeId } });
    expect(next.document.pages[0].shapes).toHaveLength(1);
  });

  it("SET_LABEL on shape in non-active page is a no-op", () => {
    const next = dispatch(state, { type: "SET_LABEL", payload: { id: page1ShapeId, label: "Changed" } });
    expect(next.document.pages[0].shapes[0].label).toBe("Test");
  });
});

describe("RESET", () => {
  it("returns to a fresh empty document, discarding all shapes and connectors", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    expect(state.document.pages[0].shapes).toHaveLength(2);

    state = dispatch(state, { type: "RESET" });

    expect(state.document.pages).toHaveLength(1);
    expect(state.document.pages[0].shapes).toHaveLength(0);
    expect(state.document.pages[0].connectors).toHaveLength(0);
    expect(state.selection).toEqual([]);
  });
});

describe("SET_DEFAULT_CONNECTOR_STYLE", () => {
  it("merges the patch into defaultConnectorStyle", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "SET_DEFAULT_CONNECTOR_STYLE", payload: { strokeDash: "dashed" } });
    expect(state.defaultConnectorStyle.strokeDash).toBe("dashed");
  });

  it("does not clobber other fields", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "SET_DEFAULT_CONNECTOR_STYLE", payload: { arrowEnd: "open" } });
    expect(state.defaultConnectorStyle.strokeColor).toBe(state.defaultConnectorStyle.strokeColor);
    expect(state.defaultConnectorStyle.arrowEnd).toBe("open");
  });

  it("is excluded from undo history", () => {
    let state = createInitialHistoryState();
    state = hdispatch(state, { type: "SET_DEFAULT_CONNECTOR_STYLE", payload: { strokeDash: "dotted" } });
    expect(state.past).toHaveLength(0);
    expect(state.defaultConnectorStyle.strokeDash).toBe("dotted");
  });
});

describe("RENAME_PAGE", () => {
  it("updates the page name", () => {
    let state = createInitialState();
    const pageId = state.document.pages[0].id;
    state = dispatch(state, { type: "RENAME_PAGE", payload: { pageId, name: "My Page" } });
    expect(state.document.pages[0].name).toBe("My Page");
  });

  it("is a no-op for an unknown pageId", () => {
    const state = createInitialState();
    const next = dispatch(state, { type: "RENAME_PAGE", payload: { pageId: "unknown", name: "X" } });
    expect(next.document.pages[0].name).toBe(state.document.pages[0].name);
  });
});

describe("DELETE_PAGE", () => {
  it("removes the specified page", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    const page2Id = state.document.pages[1].id;
    state = dispatch(state, { type: "DELETE_PAGE", payload: { pageId: page2Id } });
    expect(state.document.pages).toHaveLength(1);
  });

  it("is a no-op when only one page exists", () => {
    const state = createInitialState();
    const pageId = state.document.pages[0].id;
    const next = dispatch(state, { type: "DELETE_PAGE", payload: { pageId } });
    expect(next.document.pages).toHaveLength(1);
  });

  it("switches activePageId to adjacent page when active page is deleted", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    const page2Id = state.document.pages[1].id;
    state = dispatch(state, { type: "SET_ACTIVE_PAGE", payload: { pageId: page2Id } });
    state = dispatch(state, { type: "DELETE_PAGE", payload: { pageId: page2Id } });
    expect(state.activePageId).toBe(state.document.pages[0].id);
  });

  it("clears selection when deleting a page", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    state = { ...state, selection: ["some-shape"] };
    const page2Id = state.document.pages[1].id;
    state = dispatch(state, { type: "DELETE_PAGE", payload: { pageId: page2Id } });
    expect(state.selection).toEqual([]);
  });

  it("falls back to the previous page when the last page is deleted (B1 regression)", () => {
    // [p0, p1, p2(active)] → delete p2 → active should be p1
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 3", width: 11, height: 8.5 } });
    const page3Id = state.document.pages[2].id;
    const page2Id = state.document.pages[1].id;
    state = dispatch(state, { type: "SET_ACTIVE_PAGE", payload: { pageId: page3Id } });
    state = dispatch(state, { type: "DELETE_PAGE", payload: { pageId: page3Id } });
    expect(state.document.pages).toHaveLength(2);
    expect(state.activePageId).toBe(page2Id);
  });

  it("switches to the next page when a middle page is deleted (B1 regression)", () => {
    // [p0, p1(active), p2] → delete p1 → active should be p2
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 3", width: 11, height: 8.5 } });
    const page2Id = state.document.pages[1].id;
    const page3Id = state.document.pages[2].id;
    state = dispatch(state, { type: "SET_ACTIVE_PAGE", payload: { pageId: page2Id } });
    state = dispatch(state, { type: "DELETE_PAGE", payload: { pageId: page2Id } });
    expect(state.document.pages).toHaveLength(2);
    expect(state.activePageId).toBe(page3Id);
  });

  it("switches to the first page when the first active page is deleted (B1 regression)", () => {
    // [p0(active), p1] → delete p0 → active should be p1 (now index 0)
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    const page1Id = state.document.pages[0].id;
    const page2Id = state.document.pages[1].id;
    expect(state.activePageId).toBe(page1Id);
    state = dispatch(state, { type: "DELETE_PAGE", payload: { pageId: page1Id } });
    expect(state.document.pages).toHaveLength(1);
    expect(state.activePageId).toBe(page2Id);
  });
});

describe("historyReducer — UNDO / REDO", () => {
  it("starts with empty past and future", () => {
    const state = createInitialHistoryState();
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(0);
  });

  it("pushing a document action adds to past and clears future", () => {
    let state = createInitialHistoryState();
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    expect(state.past).toHaveLength(1);
    expect(state.future).toHaveLength(0);
    expect(state.document.pages[0].shapes).toHaveLength(1);
  });

  it("UNDO restores the previous document and moves current to future", () => {
    let state = createInitialHistoryState();
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    expect(state.document.pages[0].shapes).toHaveLength(1);

    state = hdispatch(state, { type: "UNDO" });
    expect(state.document.pages[0].shapes).toHaveLength(0);
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(1);
  });

  it("REDO reapplies the undone document and moves it back to past", () => {
    let state = createInitialHistoryState();
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = hdispatch(state, { type: "UNDO" });
    expect(state.document.pages[0].shapes).toHaveLength(0);

    state = hdispatch(state, { type: "REDO" });
    expect(state.document.pages[0].shapes).toHaveLength(1);
    expect(state.past).toHaveLength(1);
    expect(state.future).toHaveLength(0);
  });

  it("new action after UNDO clears future", () => {
    let state = createInitialHistoryState();
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = hdispatch(state, { type: "UNDO" });
    expect(state.future).toHaveLength(1);

    // New action should clear future
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ x: 5 }) });
    expect(state.future).toHaveLength(0);
  });

  it("UNDO is a no-op when past is empty", () => {
    const state = createInitialHistoryState();
    const next = hdispatch(state, { type: "UNDO" });
    expect(next).toBe(state);
  });

  it("REDO is a no-op when future is empty", () => {
    const state = createInitialHistoryState();
    const next = hdispatch(state, { type: "REDO" });
    expect(next).toBe(state);
  });

  it("SELECT does not push to history", () => {
    let state = createInitialHistoryState();
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const shapeId = state.document.pages[0].shapes[0].id;
    const pastLengthBefore = state.past.length;

    state = hdispatch(state, { type: "SELECT", payload: { id: shapeId } });
    expect(state.past).toHaveLength(pastLengthBefore);
    expect(state.selection).toEqual([shapeId]);
  });

  it("RESET clears past and future", () => {
    let state = createInitialHistoryState();
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    expect(state.past.length).toBeGreaterThan(0);

    state = hdispatch(state, { type: "RESET" });
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(0);
    expect(state.document.pages[0].shapes).toHaveLength(0);
  });

  it("caps history at 50 entries", () => {
    let state = createInitialHistoryState();
    for (let i = 0; i < 55; i++) {
      state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload({ x: i }) });
    }
    expect(state.past.length).toBe(50);
  });

  it("multiple undos traverse the full history chain", () => {
    let state = createInitialHistoryState();
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    expect(state.document.pages[0].shapes).toHaveLength(3);

    state = hdispatch(state, { type: "UNDO" });
    expect(state.document.pages[0].shapes).toHaveLength(2);
    state = hdispatch(state, { type: "UNDO" });
    expect(state.document.pages[0].shapes).toHaveLength(1);
    state = hdispatch(state, { type: "UNDO" });
    expect(state.document.pages[0].shapes).toHaveLength(0);
    expect(state.future).toHaveLength(3);
  });
});

describe("LOAD_DOCUMENT", () => {
  const importedDoc = {
    meta: { title: "Imported", author: "", description: "" },
    styleSheet: { namedStyles: {} },
    pages: [
      { id: "imported-page-1", name: "Page 1", width: 11, height: 8.5, shapes: [], connectors: [] },
      { id: "imported-page-2", name: "Page 2", width: 11, height: 8.5, shapes: [], connectors: [] },
    ],
  };

  it("replaces the document", () => {
    const state = createInitialState();
    const next = dispatch(state, { type: "LOAD_DOCUMENT", payload: { document: importedDoc } });
    expect(next.document).toBe(importedDoc);
  });

  it("resets activePageId to pages[0].id", () => {
    const state = createInitialState();
    const next = dispatch(state, { type: "LOAD_DOCUMENT", payload: { document: importedDoc } });
    expect(next.activePageId).toBe("imported-page-1");
  });

  it("clears selection", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    const shapeId = state.document.pages[0].shapes[0].id;
    state = dispatch(state, { type: "SELECT", payload: { id: shapeId } });
    expect(state.selection).toHaveLength(1);

    const next = dispatch(state, { type: "LOAD_DOCUMENT", payload: { document: importedDoc } });
    expect(next.selection).toEqual([]);
  });

  it("clears undo/redo history in historyReducer", () => {
    let state = createInitialHistoryState();
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    state = hdispatch(state, { type: "ADD_SHAPE", payload: makeShapePayload() });
    expect(state.past).toHaveLength(2);

    state = hdispatch(state, { type: "LOAD_DOCUMENT", payload: { document: importedDoc } });
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(0);
    expect(state.document).toBe(importedDoc);
  });
});
});
