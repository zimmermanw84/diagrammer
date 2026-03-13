import { useEffect } from "react";

export function useWindowEvent<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [event, handler, enabled]);
}
