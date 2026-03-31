"use client";

import { useEffect } from "react";

const HUB_PWA_CACHE_PREFIX = "xiaqiu-hub-pwa-";

/**
 * 仅在生产环境注册，避免开发模式下 Service Worker 干扰 HMR / Turbopack。
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())).catch(() => {}),
      );

      if ("caches" in window) {
        void caches.keys().then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith(HUB_PWA_CACHE_PREFIX))
              .map((key) => caches.delete(key)),
          ).catch(() => {}),
        );
      }
      return;
    }

    navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch(() => {});
  }, []);

  return null;
}
