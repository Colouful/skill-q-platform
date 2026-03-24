"use client";

import { useEffect } from "react";

/**
 * 仅在生产环境注册，避免开发模式下 Service Worker 干扰 HMR / Turbopack。
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch(() => {});
  }, []);

  return null;
}
