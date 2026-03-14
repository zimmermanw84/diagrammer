import { useCallback } from "react";

/**
 * Returns a `startDrag` function. Call it (e.g. in a `mousedown` handler) to begin
 * tracking a drag gesture on `window`. Listeners are automatically removed on `mouseup`.
 */
export function useGlobalMouseDrag() {
  return useCallback(
    (onMove: (e: MouseEvent) => void, onUp: (e: MouseEvent) => void) => {
      const handleMove = (e: MouseEvent) => onMove(e);
      const handleUp = (e: MouseEvent) => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
        onUp(e);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [],
  );
}
