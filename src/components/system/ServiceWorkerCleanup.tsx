"use client";

import { useEffect } from "react";

const CACHES_TO_DELETE = ["funfund-static-v1", "funfund-runtime-v1"];

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = async () => {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      }

      if ("caches" in window) {
        await Promise.all(CACHES_TO_DELETE.map((name) => caches.delete(name)));
      }
    };

    void run();
  }, []);

  return null;
}
