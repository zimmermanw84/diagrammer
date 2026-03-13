import React, { createContext, useContext, useReducer } from "react";
import type { DiagramAction } from "./actions.js";
import { historyReducer, createInitialHistoryState } from "./reducer.js";
import type { HistoryState } from "./reducer.js";
import { usePersistence } from "./persistence.js";

interface DiagramContextValue {
  state: HistoryState;
  dispatch: React.Dispatch<DiagramAction>;
  canUndo: boolean;
  canRedo: boolean;
}

const DiagramContext = createContext<DiagramContextValue | null>(null);

export function DiagramProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(historyReducer, undefined, createInitialHistoryState);
  usePersistence(state.document);
  return (
    <DiagramContext.Provider
      value={{
        state,
        dispatch,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
      }}
    >
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
