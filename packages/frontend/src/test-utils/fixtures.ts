import type { DiagramShape, DiagramConnector } from "@diagrammer/shared";
import { DEFAULT_SHAPE_STYLE, DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";

export function makeShape(overrides: Partial<DiagramShape> = {}): DiagramShape {
  return {
    id: "shape-1",
    type: "rectangle",
    x: 1,
    y: 1,
    width: 2,
    height: 1,
    label: "",
    style: { ...DEFAULT_SHAPE_STYLE },
    properties: {},
    ...overrides,
  };
}

export function makeConnector(overrides: Partial<DiagramConnector> = {}): DiagramConnector {
  return {
    id: "c1",
    fromShapeId: "s1",
    toShapeId: "s2",
    label: "",
    style: { ...DEFAULT_CONNECTOR_STYLE },
    routing: "straight",
    ...overrides,
  };
}

/** Shape payload without id — for dispatching ADD_SHAPE. */
export function makeShapePayload(
  overrides: Partial<Omit<DiagramShape, "id">> = {}
): Omit<DiagramShape, "id"> {
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

/** Connector payload without id — for dispatching ADD_CONNECTOR. */
export function makeConnectorPayload(
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
