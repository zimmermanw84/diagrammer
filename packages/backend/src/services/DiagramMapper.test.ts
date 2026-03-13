import { describe, it, expect } from "vitest";
import { DiagramMapper } from "./DiagramMapper.js";
import { createEmptyDocument } from "@diagrammer/shared";
import type { DiagramDocument } from "@diagrammer/shared";

const FIXTURE: DiagramDocument = {
  id: "00000000-0000-0000-0000-000000000001",
  meta: {
    title: "Test Diagram",
    author: "Test Author",
    description: "Unit test fixture",
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
          label: "Start",
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
          properties: { role: "start" },
        },
        {
          id: "00000000-0000-0000-0000-000000000011",
          type: "ellipse",
          x: 5,
          y: 1,
          width: 2,
          height: 1,
          label: "End",
          style: {
            fillColor: "#ccffcc",
            strokeColor: "#006600",
            strokeWidth: 2,
            fontFamily: "Arial",
            fontSize: 14,
            fontColor: "#003300",
            bold: true,
            italic: false,
            textAlign: "center",
            strokeDash: "dashed",
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

describe("DiagramMapper.toVsdx", () => {
  it("returns a non-empty Buffer for a minimal document", async () => {
    const buffer = await DiagramMapper.toVsdx(FIXTURE);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("returns a non-empty Buffer for an empty document", async () => {
    const empty = createEmptyDocument("Empty", "Tester");
    const buffer = await DiagramMapper.toVsdx(empty);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("handles a two-page document without error", async () => {
    const doc: DiagramDocument = {
      ...FIXTURE,
      pages: [
        FIXTURE.pages[0]!,
        {
          ...FIXTURE.pages[0]!,
          id: "00000000-0000-0000-0000-000000000003",
          name: "Page 2",
          shapes: [{ ...FIXTURE.pages[0]!.shapes[0]!, id: "00000000-0000-0000-0000-000000000030" }],
          connectors: [],
        },
      ],
    };

    const buffer = await DiagramMapper.toVsdx(doc);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("handles multiple shape types without throwing", async () => {
    const doc: DiagramDocument = {
      ...FIXTURE,
      pages: [
        {
          ...FIXTURE.pages[0]!,
          connectors: [],
          shapes: (
            ["rectangle", "ellipse", "diamond", "rounded_rectangle", "triangle", "parallelogram"] as const
          ).map((type, i) => ({
            id: `00000000-0000-0000-0000-0000000000${String(i).padStart(2, "0")}`,
            type,
            x: i * 2,
            y: 1,
            width: 1.5,
            height: 1,
            label: type,
            style: {
              fillColor: "#ffffff",
              strokeColor: "#000000",
              strokeWidth: 1,
              fontFamily: "Arial",
              fontSize: 12,
              fontColor: "#000000",
              bold: false,
              italic: false,
              textAlign: "center" as const,
              strokeDash: "solid" as const,
              shadow: false,
            },
            properties: {},
          })),
        },
      ],
    };

    const buffer = await DiagramMapper.toVsdx(doc);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
