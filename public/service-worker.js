/**
 * 虾球Hub PWA：预缓存离线壳页；导航请求网络优先，失败回退 /offline；其余 GET 网络优先并写入缓存以便二次离线可用。
 */
const CACHE_NAME = "xiaqiu-hub-pwa-v1";
const PRECACHE_URLS = ["/offline", "/manifest.json", "/icons/pwa-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  const isHtmlNavigation = request.mode === "navigate";

  if (isHtmlNavigation) {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match("/offline");
        return (
          fallback ||
          new Response("离线：无法加载页面。", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
