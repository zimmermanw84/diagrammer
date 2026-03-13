import { useState, useEffect } from "react";
import { API_BASE } from "../config.js";
const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 3000;

export function useHealthCheck(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/health`, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!cancelled) setIsOnline(res.ok);
      } catch {
        if (!cancelled) setIsOnline(false);
      }
    };

    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { isOnline };
}
