import type { DiagramDocument, DiagramPage, ConnectorStyle } from "@diagrammer/shared";
import { createEmptyDocument, DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";
import type { DiagramAction } from "./actions.js";
import { loadSavedDocument } from "./persistence.js";

const MAX_HISTORY = 50;

// Actions that only affect UI state — excluded from undo history
const EPHEMERAL_ACTIONS = new Set<DiagramAction["type"]>([
  "SELECT",
  "SET_ACTIVE_PAGE",
  "SET_DEFAULT_CONNECTOR_STYLE",
]);

export interface State {
  document: DiagramDocument;
  activePageId: string;
  selection: string | null;
  defaultConnectorStyle: ConnectorStyle;
}

export function createFreshState(): State {
  const document = createEmptyDocument();
  return {
    document,
    activePageId: document.pages[0]!.id,
    selection: null,
    defaultConnectorStyle: { ...DEFAULT_CONNECTOR_STYLE },
  };
}

export function createInitialState(): State {
  const saved = loadSavedDocument();
  if (saved) {
    return {
      document: saved,
      activePageId: saved.pages[0]!.id,
      selection: null,
      defaultConnectorStyle: { ...DEFAULT_CONNECTOR_STYLE },
    };
  }
  return createFreshState();
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
        selection: state.selection === id ? null : state.selection,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            shapes: page.shapes.filter((shape) => shape.id !== id),
            connectors: page.connectors.filter(
              (c) => c.fromShapeId !== id && c.toShapeId !== id
            ),
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

    case "RENAME_PAGE": {
      const { pageId, name } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pages: state.document.pages.map((p) =>
            p.id === pageId ? { ...p, name } : p
          ),
        },
      };
    }

    case "DELETE_PAGE": {
      const { pageId } = action.payload;
      if (state.document.pages.length <= 1) return state;
      const pages = state.document.pages.filter((p) => p.id !== pageId);
      let activePageId = state.activePageId;
      if (activePageId === pageId) {
        const idx = state.document.pages.findIndex((p) => p.id === pageId);
        activePageId = (pages[idx] ?? pages[idx - 1])!.id;
      }
      return {
        ...state,
        activePageId,
        selection: null,
        document: { ...state.document, pages },
      };
    }

    case "SELECT": {
      return { ...state, selection: action.payload.id };
    }

    case "UPDATE_CONNECTOR_STYLE": {
      const { id, style } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pages: updatePage(state.document.pages, state.activePageId, (page) => ({
            ...page,
            connectors: page.connectors.map((c) =>
              c.id === id ? { ...c, style: { ...c.style, ...style } } : c
            ),
          })),
        },
      };
    }

    case "SET_DEFAULT_CONNECTOR_STYLE":
      return {
        ...state,
        defaultConnectorStyle: { ...state.defaultConnectorStyle, ...action.payload },
      };

    case "RESET":
      return createFreshState();

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// History wrapper
// ---------------------------------------------------------------------------

export interface HistoryState extends State {
  past: DiagramDocument[];
  future: DiagramDocument[];
}

export function createInitialHistoryState(): HistoryState {
  return { ...createInitialState(), past: [], future: [] };
}

export function historyReducer(state: HistoryState, action: DiagramAction): HistoryState {
  if (action.type === "UNDO") {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1]!;
    const newPast = state.past.slice(0, -1);
    // If activePageId no longer exists in the restored document, fall back to page 0
    const validPageId = previous.pages.some((p) => p.id === state.activePageId)
      ? state.activePageId
      : previous.pages[0]!.id;
    return {
      ...state,
      document: previous,
      activePageId: validPageId,
      past: newPast,
      future: [state.document, ...state.future],
    };
  }

  if (action.type === "REDO") {
    if (state.future.length === 0) return state;
    const next = state.future[0]!;
    const newFuture = state.future.slice(1);
    const validPageId = next.pages.some((p) => p.id === state.activePageId)
      ? state.activePageId
      : next.pages[0]!.id;
    return {
      ...state,
      document: next,
      activePageId: validPageId,
      past: [...state.past, state.document],
      future: newFuture,
    };
  }

  if (action.type === "RESET") {
    return { ...createFreshState(), past: [], future: [] };
  }

  const nextState = diagramReducer(state, action);

  // Ephemeral UI actions don't push to history
  if (EPHEMERAL_ACTIONS.has(action.type)) {
    return { ...nextState, past: state.past, future: state.future };
  }

  // Only record history if the document actually changed
  if (nextState.document === state.document) {
    return { ...nextState, past: state.past, future: state.future };
  }

  return {
    ...nextState,
    past: [...state.past, state.document].slice(-MAX_HISTORY),
    future: [],
  };
}
