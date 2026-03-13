import { useEffect } from "react";
import type { DiagramShape, DiagramConnector } from "@diagrammer/shared";
import type { DiagramAction } from "../state/actions.js";

interface UseKeyboardShortcutsArgs {
  selection: string | null;
  shapes: DiagramShape[];
  connectors: DiagramConnector[];
  dispatch: React.Dispatch<DiagramAction>;
}

export function useKeyboardShortcuts({ selection, shapes, connectors, dispatch }: UseKeyboardShortcutsArgs) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selection) return;
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      // Don't fire when typing in an input
      if (!(e.target instanceof HTMLElement)) return;
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (shapes.some((s) => s.id === selection)) {
        dispatch({ type: "DELETE_SHAPE", payload: { id: selection } });
      } else if (connectors.some((c) => c.id === selection)) {
        dispatch({ type: "DELETE_CONNECTOR", payload: { id: selection } });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selection, shapes, connectors, dispatch]);
}
