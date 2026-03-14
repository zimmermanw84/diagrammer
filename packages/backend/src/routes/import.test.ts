import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../index.js";
import { DiagramMapper } from "../services/DiagramMapper.js";
import type { DiagramDocument } from "@diagrammer/shared";

const VALID_DOC: DiagramDocument = {
  id: "00000000-0000-0000-0000-000000000001",
  meta: {
    title: "Round-trip Test",
    author: "Tester",
    description: "",
    createdAt: new Date().toISOString(),
  },
  styleSheet: { namedStyles: {} },
  pages: [
    {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Page 1",
      width: 11,
      height: 8.5,
      shapes: [
        {
          id: "00000000-0000-0000-0000-000000000010",
          type: "rectangle",
          x: 1,
          y: 1,
          width: 2,
          height: 1,
          label: "Box A",
          style: {
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
          },
          properties: {},
        },
        {
          id: "00000000-0000-0000-0000-000000000011",
          type: "ellipse",
          x: 5,
          y: 2,
          width: 2,
          height: 1.5,
          label: "Box B",
          style: {
            fillColor: "#ccffcc",
            strokeColor: "#007700",
            strokeWidth: 2,
            fontFamily: "Arial",
            fontSize: 12,
            fontColor: "#000000",
            bold: false,
            italic: false,
            textAlign: "center",
            strokeDash: "solid",
            shadow: false,
          },
          properties: {},
        },
      ],
      connectors: [
        {
          id: "00000000-0000-0000-0000-000000000020",
          fromShapeId: "00000000-0000-0000-0000-000000000010",
          toShapeId: "00000000-0000-0000-0000-000000000011",
          label: "",
          style: {
            strokeColor: "#333333",
            strokeWidth: 1,
            strokeDash: "solid",
            arrowStart: "none",
            arrowEnd: "filled",
          },
          routing: "straight",
        },
      ],
    },
  ],
};

async function exportToBuffer(doc: DiagramDocument): Promise<Buffer> {
  return DiagramMapper.toVsdx(doc);
}

describe("POST /api/v1/import/vsdx", () => {
  it("returns 200 with a valid DiagramDocument for a round-tripped export", async () => {
    const buffer = await exportToBuffer(VALID_DOC);

    const res = await request(app)
      .post("/api/v1/import/vsdx")
      .attach("file", buffer, { filename: "test.vsdx", contentType: "application/vnd.ms-visio.drawing" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("meta");
    expect(res.body).toHaveProperty("pages");
    expect(Array.isArray(res.body.pages)).toBe(true);
    expect(res.body.pages.length).toBeGreaterThan(0);
  });

  it("round-trip preserves page count", async () => {
    const buffer = await exportToBuffer(VALID_DOC);

    const res = await request(app)
      .post("/api/v1/import/vsdx")
      .attach("file", buffer, { filename: "test.vsdx", contentType: "application/vnd.ms-visio.drawing" });

    expect(res.status).toBe(200);
    expect(res.body.pages).toHaveLength(VALID_DOC.pages.length);
  });

  it("round-trip preserves shape count on each page", async () => {
    const buffer = await exportToBuffer(VALID_DOC);

    const res = await request(app)
      .post("/api/v1/import/vsdx")
      .attach("file", buffer, { filename: "test.vsdx", contentType: "application/vnd.ms-visio.drawing" });

    expect(res.status).toBe(200);
    expect(res.body.pages[0].shapes).toHaveLength(VALID_DOC.pages[0]!.shapes.length);
  });

  it("round-trip preserves connector count on each page", async () => {
    const buffer = await exportToBuffer(VALID_DOC);

    const res = await request(app)
      .post("/api/v1/import/vsdx")
      .attach("file", buffer, { filename: "test.vsdx", contentType: "application/vnd.ms-visio.drawing" });

    expect(res.status).toBe(200);
    expect(res.body.pages[0].connectors).toHaveLength(VALID_DOC.pages[0]!.connectors.length);
  });

  it("returns 422 when no file is uploaded", async () => {
    const res = await request(app)
      .post("/api/v1/import/vsdx");

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 422 for a corrupt (non-zip) file", async () => {
    const corrupt = Buffer.from("this is not a vsdx file");

    const res = await request(app)
      .post("/api/v1/import/vsdx")
      .attach("file", corrupt, { filename: "bad.vsdx", contentType: "application/vnd.ms-visio.drawing" });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("error");
  });
});
