import type {
  DiagramShape,
  DiagramConnector,
  DiagramPage,
  ShapeStyle,
  ConnectorStyle,
} from "@diagrammer/shared";

export type DiagramAction =
  | { type: "ADD_SHAPE"; payload: Omit<DiagramShape, "id"> }
  | { type: "MOVE_SHAPE"; payload: { id: string; dx: number; dy: number } }
  | { type: "RESIZE_SHAPE"; payload: { id: string; width: number; height: number } }
  | { type: "DELETE_SHAPE"; payload: { id: string } }
  | { type: "SET_LABEL"; payload: { id: string; label: string } }
  | { type: "UPDATE_STYLE"; payload: { id: string; style: Partial<ShapeStyle> } }
  | { type: "SET_PROPERTY"; payload: { id: string; key: string; value: string } }
  | { type: "DELETE_PROPERTY"; payload: { id: string; key: string } }
  | { type: "ADD_CONNECTOR"; payload: Omit<DiagramConnector, "id"> }
  | { type: "DELETE_CONNECTOR"; payload: { id: string } }
  | { type: "ADD_PAGE"; payload: Omit<DiagramPage, "id" | "shapes" | "connectors"> }
  | { type: "SET_ACTIVE_PAGE"; payload: { pageId: string } }
  | { type: "SELECT"; payload: { id: string | null } }
  | { type: "UPDATE_CONNECTOR_STYLE"; payload: { id: string; style: Partial<ConnectorStyle> } }
  | { type: "RESET" }
  | { type: "UNDO" }
  | { type: "REDO" };
