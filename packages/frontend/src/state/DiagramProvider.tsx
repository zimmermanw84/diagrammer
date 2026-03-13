import React, { createContext, useContext, useReducer } from "react";
import type { DiagramAction } from "./actions.js";
import { diagramReducer, createInitialState } from "./reducer.js";
import type { State } from "./reducer.js";
import { usePersistence } from "./persistence.js";

interface DiagramContextValue {
  state: State;
  dispatch: React.Dispatch<DiagramAction>;
}

const DiagramContext = createContext<DiagramContextValue | null>(null);

export function DiagramProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(diagramReducer, undefined, createInitialState);
  usePersistence(state.document);
  return (
    <DiagramContext.Provider value={{ state, dispatch }}>
      {children}
    </DiagramContext.Provider>
  );
}

export function useDiagram(): DiagramContextValue {
  const ctx = useContext(DiagramContext);
  if (ctx === null) {
    throw new Error("useDiagram must be used within a DiagramProvider");
  }
  return ctx;
}
