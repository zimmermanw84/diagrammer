import { describe, it, expect, beforeEach } from "vitest";
import { diagramReducer, createInitialState } from "./reducer.js";
import type { State } from "./reducer.js";
import type { DiagramAction } from "./actions.js";
import type { DiagramShape, DiagramConnector } from "@diagrammer/shared";
import { DEFAULT_SHAPE_STYLE, DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";

// Helper: build a minimal shape payload (no id)
function makeShapePayload(overrides: Partial<Omit<DiagramShape, "id">> = {}): Omit<DiagramShape, "id"> {
  return {
    type: "rectangle",
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    label: "Test",
    style: { ...DEFAULT_SHAPE_STYLE },
    properties: {},
    ...overrides,
  };
}

// Helper: build a minimal connector payload (no id)
function makeConnectorPayload(
  fromShapeId: string,
  toShapeId: string,
  overrides: Partial<Omit<DiagramConnector, "id">> = {}
): Omit<DiagramConnector, "id"> {
  return {
    fromShapeId,
    toShapeId,
    label: "",
    style: { ...DEFAULT_CONNECTOR_STYLE },
    routing: "straight",
    ...overrides,
  };
}

function dispatch(state: State, action: DiagramAction): State {
  return diagramReducer(state, action);
}

describe("createInitialState", () => {
  it("returns a valid initial state with one page", () => {
    const state = createInitialState();
    expect(state.document.pages).toHaveLength(1);
    expect(state.activePageId).toBe(state.document.pages[0].id);
    expect(state.selection).toBeNull();
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
    expect(state.selection).toBe(shapeId);

    state = dispatch(state, { type: "DELETE_SHAPE", payload: { id: shapeId } });
    expect(state.selection).toBeNull();
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
    state = { ...state, selection: "some-shape-id" };
    state = dispatch(state, { type: "ADD_PAGE", payload: { name: "Page 2", width: 11, height: 8.5 } });
    const page2Id = state.document.pages[1].id;
    state = dispatch(state, { type: "SET_ACTIVE_PAGE", payload: { pageId: page2Id } });
    expect(state.selection).toBeNull();
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
