import { VisioDocument, ArrowHeads } from "ts-visio";
import type { ShapeGeometry } from "ts-visio";
import type { DiagramDocument, ShapeType, ArrowHeadType, StrokeDash } from "@diagrammer/shared";

// ---------------------------------------------------------------------------
// Mapping tables
// ---------------------------------------------------------------------------

const GEOMETRY_MAP: Record<ShapeType, ShapeGeometry> = {
  rectangle: "rectangle",
  ellipse: "ellipse",
  diamond: "diamond",
  rounded_rectangle: "rounded-rectangle",
  triangle: "triangle",
  parallelogram: "parallelogram",
  image: "rectangle", // fallback for image shapes
};

const LINE_PATTERN_MAP: Record<StrokeDash, number> = {
  solid: 1,
  dashed: 2,
  dotted: 3,
};

const ARROW_HEAD_MAP: Record<ArrowHeadType, string> = {
  none: ArrowHeads.None,
  open: ArrowHeads.Open,
  filled: ArrowHeads.Standard,
  crowsfoot: ArrowHeads.CrowsFoot,
  one: ArrowHeads.One,
};

const ROUTING_MAP: Record<string, string> = {
  straight: "straight",
  curved: "curved",
  right_angle: "orthogonal",
};

// ---------------------------------------------------------------------------
// DiagramMapper
// ---------------------------------------------------------------------------

export class DiagramMapper {
  /**
   * Convert a DiagramDocument to a .vsdx Buffer using ts-visio.
   *
   * Coordinate system: our schema stores shapes with (x, y) as the top-left
   * corner in inches. Visio uses the center as the pin point with Y going up
   * from the bottom, so we transform:
   *   visio_cx = x + width / 2
   *   visio_cy = pageHeight - y - height / 2
   */
  static async toVsdx(doc: DiagramDocument): Promise<Buffer> {
    const visioDoc = await VisioDocument.create();

    visioDoc.setMetadata({
      title: doc.meta.title,
      author: doc.meta.author,
      description: doc.meta.description,
    });

    // Process each page
    for (let pageIndex = 0; pageIndex < doc.pages.length; pageIndex++) {
      const page = doc.pages[pageIndex];

      let visioPage;
      if (pageIndex === 0) {
        // Reuse the default page that VisioDocument.create() provides
        visioPage = visioDoc.pages[0];
        visioDoc.renamePage(visioPage, page.name);
      } else {
        visioPage = await visioDoc.addPage(page.name);
      }

      // Set page dimensions (in inches)
      visioPage.setSize(page.width, page.height);

      // Map shape id → ts-visio Shape for connector wiring
      const shapeMap = new Map<string, Awaited<ReturnType<typeof visioPage.addShape>>>();

      // Add shapes
      for (const shape of page.shapes) {
        const cx = shape.x + shape.width / 2;
        const cy = page.height - shape.y - shape.height / 2;

        const visioShape = await visioPage.addShape({
          text: shape.label,
          x: cx,
          y: cy,
          width: shape.width,
          height: shape.height,
          geometry: GEOMETRY_MAP[shape.type],
          fillColor: shape.style.fillColor,
          lineColor: shape.style.strokeColor,
          linePattern: LINE_PATTERN_MAP[shape.style.strokeDash],
          fontColor: shape.style.fontColor,
          fontSize: shape.style.fontSize,
          fontFamily: shape.style.fontFamily,
          bold: shape.style.bold,
          italic: shape.style.italic,
          horzAlign: shape.style.textAlign as "left" | "center" | "right",
        });

        // lineWeight is not supported in NewShapeProps — must use setStyle
        await visioShape.setStyle({
          lineWeight: shape.style.strokeWidth,
        });

        // Embed image src as a custom property for round-trip fidelity
        if (shape.type === "image" && shape.src) {
          visioShape.addData("imageSrc", { value: shape.src, label: "Image Source" });
        }

        // Custom properties
        for (const [key, value] of Object.entries(shape.properties)) {
          visioShape.addData(key, { value, label: key });
        }

        shapeMap.set(shape.id, visioShape);
      }

      // Add connectors
      for (const connector of page.connectors) {
        const fromShape = shapeMap.get(connector.fromShapeId);
        const toShape = shapeMap.get(connector.toShapeId);
        if (!fromShape || !toShape) continue;

        await visioPage.connectShapes(
          fromShape,
          toShape,
          ARROW_HEAD_MAP[connector.style.arrowStart],
          ARROW_HEAD_MAP[connector.style.arrowEnd],
          {
            lineColor: connector.style.strokeColor,
            lineWeight: connector.style.strokeWidth,
            linePattern: LINE_PATTERN_MAP[connector.style.strokeDash],
            routing: (ROUTING_MAP[connector.routing] ?? "straight") as "straight" | "orthogonal" | "curved",
          },
        );
      }
    }

    return visioDoc.save() as Promise<Buffer>;
  }
}
