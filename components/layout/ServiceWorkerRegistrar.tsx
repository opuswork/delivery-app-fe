"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js in production builds only, so development never serves
 * stale cached files.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => undefined); // the app works without it
  }, []);

  return null;
}
