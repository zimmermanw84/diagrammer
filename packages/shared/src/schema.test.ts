import { describe, it, expect } from "vitest";
import {
  DiagramDocumentSchema,
  DiagramShapeSchema,
  DiagramConnectorSchema,
  ShapeStyleSchema,
  ConnectorStyleSchema,
  createEmptyDocument,
  DEFAULT_SHAPE_STYLE,
  DEFAULT_CONNECTOR_STYLE,
} from "./schema.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeShape(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    type: "rectangle" as const,
    x: 1,
    y: 1,
    width: 2,
    height: 1,
    label: "Box",
    style: { ...DEFAULT_SHAPE_STYLE },
    properties: {},
    ...overrides,
  };
}

function makeConnector(fromShapeId: string, toShapeId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    fromShapeId,
    toShapeId,
    label: "",
    style: { ...DEFAULT_CONNECTOR_STYLE },
    routing: "straight" as const,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createEmptyDocument
// ---------------------------------------------------------------------------

describe("createEmptyDocument", () => {
  it("produces a document that passes schema validation", () => {
    const doc = createEmptyDocument();
    expect(DiagramDocumentSchema.safeParse(doc).success).toBe(true);
  });

  it("uses provided title and author", () => {
    const doc = createEmptyDocument("My Diagram", "Alice");
    expect(doc.meta.title).toBe("My Diagram");
    expect(doc.meta.author).toBe("Alice");
  });

  it("defaults title to 'Untitled Diagram'", () => {
    const doc = createEmptyDocument();
    expect(doc.meta.title).toBe("Untitled Diagram");
  });

  it("starts with one empty page", () => {
    const doc = createEmptyDocument();
    expect(doc.pages).toHaveLength(1);
    expect(doc.pages[0]!.shapes).toHaveLength(0);
    expect(doc.pages[0]!.connectors).toHaveLength(0);
  });

  it("uses letter-landscape dimensions (11\" x 8.5\")", () => {
    const doc = createEmptyDocument();
    expect(doc.pages[0]!.width).toBe(11);
    expect(doc.pages[0]!.height).toBe(8.5);
  });

  it("generates unique ids on each call", () => {
    const a = createEmptyDocument();
    const b = createEmptyDocument();
    expect(a.id).not.toBe(b.id);
    expect(a.pages[0]!.id).not.toBe(b.pages[0]!.id);
  });
});

// ---------------------------------------------------------------------------
// DiagramDocumentSchema
// ---------------------------------------------------------------------------

describe("DiagramDocumentSchema", () => {
  it("accepts a document with shapes and connectors", () => {
    const doc = createEmptyDocument();
    const shapeA = makeShape();
    const shapeB = makeShape({ x: 4 });
    const connector = makeConnector(shapeA.id, shapeB.id);
    doc.pages[0]!.shapes = [shapeA, shapeB];
    doc.pages[0]!.connectors = [connector];
    expect(DiagramDocumentSchema.safeParse(doc).success).toBe(true);
  });

  it("rejects a document with no pages", () => {
    const doc = { ...createEmptyDocument(), pages: [] };
    expect(DiagramDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it("rejects a missing id", () => {
    const { id: _id, ...doc } = createEmptyDocument();
    expect(DiagramDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it("rejects a non-uuid id", () => {
    const doc = { ...createEmptyDocument(), id: "not-a-uuid" };
    expect(DiagramDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it("rejects an invalid createdAt timestamp", () => {
    const doc = createEmptyDocument();
    doc.meta.createdAt = "not-a-date";
    expect(DiagramDocumentSchema.safeParse(doc).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ShapeStyleSchema
// ---------------------------------------------------------------------------

describe("ShapeStyleSchema", () => {
  it("accepts valid default style", () => {
    expect(ShapeStyleSchema.safeParse(DEFAULT_SHAPE_STYLE).success).toBe(true);
  });

  it("rejects invalid hex color", () => {
    const style = { ...DEFAULT_SHAPE_STYLE, fillColor: "red" };
    expect(ShapeStyleSchema.safeParse(style).success).toBe(false);
  });

  it("rejects zero strokeWidth", () => {
    const style = { ...DEFAULT_SHAPE_STYLE, strokeWidth: 0 };
    expect(ShapeStyleSchema.safeParse(style).success).toBe(false);
  });

  it("rejects negative fontSize", () => {
    const style = { ...DEFAULT_SHAPE_STYLE, fontSize: -1 };
    expect(ShapeStyleSchema.safeParse(style).success).toBe(false);
  });

  it("rejects invalid textAlign", () => {
    const style = { ...DEFAULT_SHAPE_STYLE, textAlign: "justify" };
    expect(ShapeStyleSchema.safeParse(style).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DiagramShapeSchema
// ---------------------------------------------------------------------------

describe("DiagramShapeSchema", () => {
  it("accepts all valid ShapeTypes", () => {
    const types = ["rectangle", "ellipse", "diamond", "rounded_rectangle", "triangle", "parallelogram", "image"];
    for (const type of types) {
      expect(DiagramShapeSchema.safeParse(makeShape({ type })).success).toBe(true);
    }
  });

  it("rejects unknown shape type", () => {
    expect(DiagramShapeSchema.safeParse(makeShape({ type: "hexagon" })).success).toBe(false);
  });

  it("rejects zero width", () => {
    expect(DiagramShapeSchema.safeParse(makeShape({ width: 0 })).success).toBe(false);
  });

  it("rejects non-uuid parentId", () => {
    expect(DiagramShapeSchema.safeParse(makeShape({ parentId: "bad-id" })).success).toBe(false);
  });

  it("accepts optional parentId when omitted", () => {
    const shape = makeShape();
    expect(DiagramShapeSchema.safeParse(shape).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DiagramConnectorSchema
// ---------------------------------------------------------------------------

describe("DiagramConnectorSchema", () => {
  it("accepts valid default connector style", () => {
    expect(ConnectorStyleSchema.safeParse(DEFAULT_CONNECTOR_STYLE).success).toBe(true);
  });

  it("accepts all ArrowHeadTypes", () => {
    const heads = ["none", "open", "filled", "crowsfoot", "one"];
    for (const head of heads) {
      const style = { ...DEFAULT_CONNECTOR_STYLE, arrowEnd: head };
      expect(ConnectorStyleSchema.safeParse(style).success).toBe(true);
    }
  });

  it("rejects unknown arrow head type", () => {
    const style = { ...DEFAULT_CONNECTOR_STYLE, arrowEnd: "double" };
    expect(ConnectorStyleSchema.safeParse(style).success).toBe(false);
  });

  it("accepts all routing algorithms", () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();
    for (const routing of ["straight", "curved", "right_angle"]) {
      expect(DiagramConnectorSchema.safeParse(makeConnector(id1, id2, { routing })).success).toBe(true);
    }
  });

  it("rejects non-uuid fromShapeId", () => {
    const id = crypto.randomUUID();
    expect(DiagramConnectorSchema.safeParse(makeConnector("bad-id", id)).success).toBe(false);
  });
});
