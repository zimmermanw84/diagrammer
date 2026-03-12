import type { DiagramDocument, DiagramPage } from "@diagrammer/shared";
import { createEmptyDocument } from "@diagrammer/shared";
import type { DiagramAction } from "./actions.js";

export interface State {
  document: DiagramDocument;
  activePageId: string;
  selection: string | null;
}

export function createInitialState(): State {
  const document = createEmptyDocument();
  return {
    document,
    activePageId: document.pages[0].id,
    selection: null,
  };
}

function updatePage(
  pages: DiagramPage[],
  activePageId: string,
  updater: (page: DiagramPage) => DiagramPage
): DiagramPage[] {
  return pages.map((page) =>
    page.id === activePageId ? updater(page) : page
  );
}

export function diagramReducer(state: State, action: DiagramAction): State {
  switch (action.type) {
    case "ADD_SHAPE": {
      const id = crypto.randomUUID();
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            shapes: [...page.shapes, { ...action.payload, id }],
          })),
        },
      };
    }

    case "MOVE_SHAPE": {
      const { id, dx, dy } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            shapes: page.shapes.map((shape) =>
              shape.id === id
                ? { ...shape, x: shape.x + dx, y: shape.y + dy }
                : shape
            ),
          })),
        },
      };
    }

    case "RESIZE_SHAPE": {
      const { id, width, height } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            shapes: page.shapes.map((shape) =>
              shape.id === id ? { ...shape, width, height } : shape
            ),
          })),
        },
      };
    }

    case "DELETE_SHAPE": {
      const { id } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            shapes: page.shapes.filter((shape) => shape.id !== id),
          })),
        },
      };
    }

    case "SET_LABEL": {
      const { id, label } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            shapes: page.shapes.map((shape) =>
              shape.id === id ? { ...shape, label } : shape
            ),
            connectors: page.connectors.map((connector) =>
              connector.id === id ? { ...connector, label } : connector
            ),
          })),
        },
      };
    }

    case "UPDATE_STYLE": {
      const { id, style } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            shapes: page.shapes.map((shape) =>
              shape.id === id
                ? { ...shape, style: { ...shape.style, ...style } }
                : shape
            ),
          })),
        },
      };
    }

    case "SET_PROPERTY": {
      const { id, key, value } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            shapes: page.shapes.map((shape) =>
              shape.id === id
                ? { ...shape, properties: { ...shape.properties, [key]: value } }
                : shape
            ),
          })),
        },
      };
    }

    case "DELETE_PROPERTY": {
      const { id, key } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            shapes: page.shapes.map((shape) => {
              if (shape.id !== id) return shape;
              const properties = { ...shape.properties };
              delete properties[key];
              return { ...shape, properties };
            }),
          })),
        },
      };
    }

    case "ADD_CONNECTOR": {
      const id = crypto.randomUUID();
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            connectors: [...page.connectors, { ...action.payload, id }],
          })),
        },
      };
    }

    case "DELETE_CONNECTOR": {
      const { id } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            connectors: page.connectors.filter((connector) => connector.id !== id),
          })),
        },
      };
    }

    case "ADD_PAGE": {
      const id = crypto.randomUUID();
      const newPage = {
        ...action.payload,
        id,
        shapes: [],
        connectors: [],
      };
      return {
        ...state,
        document: {
          ...state.document,
          pages: [...state.document.pages, newPage],
        },
      };
    }

    case "SET_ACTIVE_PAGE": {
      return {
        ...state,
        activePageId: action.payload.pageId,
        selection: null,
      };
    }

    default:
      return state;
  }
}
