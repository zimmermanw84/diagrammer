import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../index.js";
import { createEmptyDocument } from "@diagrammer/shared";
import type { DiagramDocument } from "@diagrammer/shared";

const VALID_DOC: DiagramDocument = {
  id: "00000000-0000-0000-0000-000000000001",
  meta: {
    title: "Integration Test Diagram",
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
          label: "Box",
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
      ],
      connectors: [],
    },
  ],
};

describe("POST /api/v1/export/vsdx", () => {
  it("returns 200 with binary vsdx content-type for a valid document", async () => {
    const res = await request(app)
      .post("/api/v1/export/vsdx")
      .send(VALID_DOC)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch("application/vnd.ms-visio.drawing");
    expect(res.headers["content-disposition"]).toMatch(/attachment.*\.vsdx/);
    expect((res.body as Buffer).length).toBeGreaterThan(0);
  });

  it("returns 200 for an empty document (no shapes)", async () => {
    const empty = createEmptyDocument("Empty", "Tester");
    const res = await request(app)
      .post("/api/v1/export/vsdx")
      .send(empty)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch("application/vnd.ms-visio.drawing");
  });

  it("returns 422 for a missing required field", async () => {
    const { meta: _meta, ...withoutMeta } = VALID_DOC;
    const res = await request(app)
      .post("/api/v1/export/vsdx")
      .send(withoutMeta);

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("issues");
  });

  it("returns 422 for an invalid shape style color", async () => {
    const bad = structuredClone(VALID_DOC);
    bad.pages[0]!.shapes[0]!.style.fillColor = "not-a-color";
    const res = await request(app)
      .post("/api/v1/export/vsdx")
      .send(bad);

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("issues");
  });

  it("returns 422 for an empty body", async () => {
    const res = await request(app)
      .post("/api/v1/export/vsdx")
      .send({});

    expect(res.status).toBe(422);
  });

  it("sanitizes the title in the Content-Disposition filename", async () => {
    const doc = { ...VALID_DOC, meta: { ...VALID_DOC.meta, title: "My Diagram / 2024" } };
    const res = await request(app)
      .post("/api/v1/export/vsdx")
      .send(doc)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).not.toContain("/");
  });
});
