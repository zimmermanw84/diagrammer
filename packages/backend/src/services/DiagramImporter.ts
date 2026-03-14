import { VisioDocument, ArrowHeads } from "ts-visio";
import type { Shape, Connector, Page } from "ts-visio";
import type {
  DiagramDocument,
  DiagramPage,
  DiagramShape,
  DiagramConnector,
  ShapeType,
  ShapeStyle,
  ConnectorStyle,
  ArrowHeadType,
  StrokeDash,
  RoutingAlgorithm,
} from "@diagrammer/shared";
import { DEFAULT_SHAPE_STYLE, DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";

// ---------------------------------------------------------------------------
// Reverse-mapping tables (Visio → DiagramDocument)
// ---------------------------------------------------------------------------

const GEOMETRY_REVERSE_MAP: Record<string, ShapeType> = {
  rectangle: "rectangle",
  ellipse: "ellipse",
  diamond: "diamond",
  "rounded-rectangle": "rounded_rectangle",
  triangle: "triangle",
  parallelogram: "parallelogram",
};

const LINE_PATTERN_REVERSE_MAP: Record<number, StrokeDash> = {
  1: "solid",
  2: "dashed",
  3: "dotted",
};

const ARROW_HEAD_REVERSE_MAP: Record<string, ArrowHeadType> = {
  [ArrowHeads.None]: "none",
  [ArrowHeads.Open]: "open",
  [ArrowHeads.Standard]: "filled",
  [ArrowHeads.CrowsFoot]: "crowsfoot",
  [ArrowHeads.One]: "one",
};

const ROUTING_REVERSE_MAP: Record<string, RoutingAlgorithm> = {
  straight: "straight",
  curved: "curved",
  orthogonal: "right_angle",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveShapeType(shape: Shape): ShapeType {
  const name = shape.name.toLowerCase();
  for (const [keyword, shapeType] of Object.entries(GEOMETRY_REVERSE_MAP)) {
    if (name.includes(keyword.replace(/-/g, ""))) return shapeType;
  }
  return "rectangle";
}

function normalizeColor(hex: string | undefined, fallback: string): string {
  if (!hex) return fallback;
  let s = hex.startsWith("#") ? hex : `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}

// ---------------------------------------------------------------------------
// DiagramImporter
// ---------------------------------------------------------------------------

export class DiagramImporter {
  /**
   * Parse a `.vsdx` buffer and return a fully-valid `DiagramDocument`.
   * Throws on corrupt or unsupported files.
   */
  static async fromVsdx(buffer: Buffer): Promise<DiagramDocument> {
    const visioDoc = await VisioDocument.load(buffer);
    const metadata = visioDoc.getMetadata();

    let pages: DiagramPage[] = visioDoc.pages.map((p) =>
      DiagramImporter.importPage(p)
    );

    if (pages.length === 0) {
      pages = [{
        id: crypto.randomUUID(),
        name: "Page 1",
        width: 11,
        height: 8.5,
        shapes: [],
        connectors: [],
      }];
    }

    return {
      id: crypto.randomUUID(),
      meta: {
        title: metadata.title ?? "Imported Diagram",
        author: metadata.author ?? "",
        description: metadata.description ?? "",
        createdAt: metadata.created?.toISOString() ?? new Date().toISOString(),
      },
      pages,
      styleSheet: { namedStyles: {} },
    };
  }

  // -------------------------------------------------------------------------
  // Page
  // -------------------------------------------------------------------------

  private static importPage(visioPage: Page): DiagramPage {
    const pageHeight = visioPage.pageHeight;

    const visioShapes = visioPage.getShapes();
    const visioConnectors = visioPage.getConnectors();

    // getShapes() includes connector shapes (1D shapes with h=0) — exclude them
    const connectorShapeIds = new Set(visioConnectors.map((c) => c.id));

    // Build Visio shape ID → new UUID map for connector wiring (2D shapes only)
    const idMap = new Map<string, string>();
    for (const s of visioShapes) {
      if (!connectorShapeIds.has(s.id)) {
        idMap.set(s.id, crypto.randomUUID());
      }
    }

    const shapes: DiagramShape[] = visioShapes
      .filter((s) => !connectorShapeIds.has(s.id))
      .map((s) => DiagramImporter.importShape(s, pageHeight, idMap))
      .filter((s): s is DiagramShape => s !== undefined);

    const connectors: DiagramConnector[] = visioConnectors
      .map((c) => DiagramImporter.importConnector(c, idMap))
      .filter((c): c is DiagramConnector => c !== undefined);

    return {
      id: crypto.randomUUID(),
      name: visioPage.name,
      width: visioPage.pageWidth,
      height: pageHeight,
      shapes,
      connectors,
    };
  }

  // -------------------------------------------------------------------------
  // Shape
  // -------------------------------------------------------------------------

  private static importShape(
    shape: Shape,
    pageHeight: number,
    idMap: Map<string, string>,
  ): DiagramShape | undefined {
    const uuid = idMap.get(shape.id);
    if (!uuid) return undefined;

    const { width, height } = shape;

    // Visio: center-pin, Y-up → schema: top-left, Y-down
    const x = shape.x - width / 2;
    const y = pageHeight - shape.y - height / 2;

    const props = shape.getProperties();

    // Recover imageSrc written during export for round-trip fidelity
    const imageSrcProp = props["imageSrc"];
    const src = imageSrcProp !== undefined ? String(imageSrcProp.value) : undefined;

    // All other custom properties
    const properties: Record<string, string> = {};
    for (const [key, data] of Object.entries(props)) {
      if (key === "imageSrc") continue;
      properties[key] = String(data.value);
    }

    const shapeType: ShapeType = src ? "image" : resolveShapeType(shape);
    const style: ShapeStyle = { ...DEFAULT_SHAPE_STYLE };

    return {
      id: uuid,
      type: shapeType,
      x,
      y,
      width,
      height,
      label: shape.text ?? "",
      style,
      properties,
      ...(src ? { src } : {}),
    };
  }

  // -------------------------------------------------------------------------
  // Connector
  // -------------------------------------------------------------------------

  private static importConnector(
    connector: Connector,
    idMap: Map<string, string>,
  ): DiagramConnector | undefined {
    if (!connector.fromShapeId || !connector.toShapeId) return undefined;

    const fromUuid = idMap.get(connector.fromShapeId);
    const toUuid = idMap.get(connector.toShapeId);
    if (!fromUuid || !toUuid) return undefined;

    const style: ConnectorStyle = {
      ...DEFAULT_CONNECTOR_STYLE,
      strokeColor: normalizeColor(
        connector.style.lineColor,
        DEFAULT_CONNECTOR_STYLE.strokeColor,
      ),
      strokeWidth: connector.style.lineWeight ?? DEFAULT_CONNECTOR_STYLE.strokeWidth,
      strokeDash: LINE_PATTERN_REVERSE_MAP[connector.style.linePattern ?? 1] ?? "solid",
      arrowStart: ARROW_HEAD_REVERSE_MAP[connector.beginArrow] ?? "none",
      arrowEnd: ARROW_HEAD_REVERSE_MAP[connector.endArrow] ?? "filled",
    };

    const routing: RoutingAlgorithm =
      ROUTING_REVERSE_MAP[connector.style.routing ?? "straight"] ?? "straight";

    return {
      id: crypto.randomUUID(),
      fromShapeId: fromUuid,
      toShapeId: toUuid,
      label: "",
      style,
      routing,
    };
  }
}
