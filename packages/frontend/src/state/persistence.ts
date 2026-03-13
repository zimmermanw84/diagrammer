import { useEffect, useRef } from "react";
import { DiagramDocumentSchema } from "@diagrammer/shared";
import type { DiagramDocument } from "@diagrammer/shared";

export const STORAGE_KEY = "diagrammer_document";
const DEBOUNCE_MS = 300;

export function loadSavedDocument(): DiagramDocument | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const result = DiagramDocumentSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function usePersistence(document: DiagramDocument): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
      } catch {
        // localStorage unavailable or full — silently ignore
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [document]);
}
