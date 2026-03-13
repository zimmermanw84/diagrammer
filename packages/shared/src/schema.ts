import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const ShapeTypeSchema = z.enum([
  "rectangle",
  "ellipse",
  "diamond",
  "rounded_rectangle",
  "triangle",
  "parallelogram",
  "image",
]);

export const ArrowHeadTypeSchema = z.enum([
  "none",
  "open",
  "filled",
  "crowsfoot",
  "one",
]);

export const RoutingAlgorithmSchema = z.enum([
  "straight",
  "curved",
  "right_angle",
]);

export const TextAlignSchema = z.enum(["left", "center", "right"]);

export const StrokeDashSchema = z.enum(["solid", "dashed", "dotted"]);

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

export const ShapeStyleSchema = z.object({
  fillColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  strokeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  strokeWidth: z.number().positive(),
  fontFamily: z.string(),
  fontSize: z.number().positive(),
  fontColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  bold: z.boolean(),
  italic: z.boolean(),
  textAlign: TextAlignSchema,
  strokeDash: StrokeDashSchema,
  shadow: z.boolean(),
});

export const ConnectorStyleSchema = z.object({
  strokeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  strokeWidth: z.number().positive(),
  strokeDash: StrokeDashSchema,
  arrowStart: ArrowHeadTypeSchema,
  arrowEnd: ArrowHeadTypeSchema,
});

export const StyleSheetSchema = z.object({
  namedStyles: z.record(z.string(), ShapeStyleSchema.partial()),
});

// ---------------------------------------------------------------------------
// Shapes & Connectors
// ---------------------------------------------------------------------------

export const DiagramShapeSchema = z.object({
  id: z.string().uuid(),
  type: ShapeTypeSchema,
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  label: z.string(),
  style: ShapeStyleSchema,
  properties: z.record(z.string(), z.string()),
  parentId: z.string().uuid().optional(),
  // Only present when type === "image"
  src: z.string().optional(),
});

export const DiagramConnectorSchema = z.object({
  id: z.string().uuid(),
  fromShapeId: z.string().uuid(),
  toShapeId: z.string().uuid(),
  label: z.string(),
  style: ConnectorStyleSchema,
  routing: RoutingAlgorithmSchema,
});

// ---------------------------------------------------------------------------
// Page & Document
// ---------------------------------------------------------------------------

export const DiagramPageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  shapes: z.array(DiagramShapeSchema),
  connectors: z.array(DiagramConnectorSchema),
});

export const DocumentMetaSchema = z.object({
  title: z.string(),
  author: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
});

export const DiagramDocumentSchema = z.object({
  id: z.string().uuid(),
  meta: DocumentMetaSchema,
  pages: z.array(DiagramPageSchema).min(1),
  styleSheet: StyleSheetSchema,
});

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------

export type ShapeType = z.infer<typeof ShapeTypeSchema>;
export type ArrowHeadType = z.infer<typeof ArrowHeadTypeSchema>;
export type RoutingAlgorithm = z.infer<typeof RoutingAlgorithmSchema>;
export type TextAlign = z.infer<typeof TextAlignSchema>;
export type StrokeDash = z.infer<typeof StrokeDashSchema>;
export type ShapeStyle = z.infer<typeof ShapeStyleSchema>;
export type ConnectorStyle = z.infer<typeof ConnectorStyleSchema>;
export type StyleSheet = z.infer<typeof StyleSheetSchema>;
export type DiagramShape = z.infer<typeof DiagramShapeSchema>;
export type DiagramConnector = z.infer<typeof DiagramConnectorSchema>;
export type DiagramPage = z.infer<typeof DiagramPageSchema>;
export type DocumentMeta = z.infer<typeof DocumentMetaSchema>;
export type DiagramDocument = z.infer<typeof DiagramDocumentSchema>;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createEmptyDocument(
  title = "Untitled Diagram",
  author = ""
): DiagramDocument {
  return {
    id: crypto.randomUUID(),
    meta: {
      title,
      author,
      description: "",
      createdAt: new Date().toISOString(),
    },
    pages: [
      {
        id: crypto.randomUUID(),
        name: "Page 1",
        width: 11,   // inches (letter landscape)
        height: 8.5,
        shapes: [],
        connectors: [],
      },
    ],
    styleSheet: {
      namedStyles: {
        "Blue": { fillColor: "#89b4fa", strokeColor: "#1e66f5", fontColor: "#1e1e2e" },
        "Red": { fillColor: "#f38ba8", strokeColor: "#e64553", fontColor: "#1e1e2e" },
        "Green": { fillColor: "#a6e3a1", strokeColor: "#40a02b", fontColor: "#1e1e2e" },
        "Yellow": { fillColor: "#f9e2af", strokeColor: "#df8e1d", fontColor: "#1e1e2e" },
        "Dashed": { strokeDash: "dashed" },
        "Dotted": { strokeDash: "dotted" },
        "Shadow": { shadow: true },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Default styles
// ---------------------------------------------------------------------------

export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
  fillColor: "#ffffff",
  strokeColor: "#000000",
  strokeWidth: 1,
  fontFamily: "Arial",
  fontSize: 12,
  fontColor: "#000000",
  bold: false,
  italic: false,
  textAlign: "center",
  strokeDash: "solid",
  shadow: false,
};

export const DEFAULT_CONNECTOR_STYLE: ConnectorStyle = {
  strokeColor: "#000000",
  strokeWidth: 1,
  strokeDash: "solid",
  arrowStart: "none",
  arrowEnd: "filled",
};
