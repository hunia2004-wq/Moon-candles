"use client";

import { useEffect, useRef } from "react";

export function useAutoRefresh(refresh: () => void, enabled = true, intervalMs = 30000) {
  const ref = useRef(refresh);
  ref.current = refresh;

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      if (document.visibilityState === "visible") ref.current();
    };

    document.addEventListener("visibilitychange", run);
    window.addEventListener("focus", run);
    const id = setInterval(run, intervalMs);

    return () => {
      document.removeEventListener("visibilitychange", run);
      window.removeEventListener("focus", run);
      clearInterval(id);
    };
  }, [enabled, intervalMs]);
}