const CACHE_NAME = "getos-v2";
const PRECACHE_URLS = ["/", "/index.html", "/manifest.json"];

// Install — precache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clear ALL old caches (including previous versions) so stale
// JS chunks from a prior build don't get served alongside new ones, which
// causes "Cannot read properties of null (reading 'useState')" from
// mismatched React copies.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
  // Tell all open pages to reload so they pick up fresh JS from the network
  // instead of whatever the old SW already injected.
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.navigate(client.url));
  });
});

// Fetch — cache-first for static assets, network-first with offline fallback for navigation
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== "GET") return;

  // Skip cross-origin and API calls (base44 SDK, integrations) — let network handle them
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/base44/")) return;

  // Never cache Vite dev/ HMR paths — they change on every rebuild and
  // stale copies cause React hook errors (null React) in development.
  if (
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/.vite/") ||
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/@react-refresh")
  ) {
    return;
  }

  // Navigation requests — try network, fall back to cached index.html for offline SPA
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Static assets — cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
