/* Service worker pre offline režim Auditora promptov.
   Stratégie:
   - navigácie: network-first s fallbackom na cache / offline stránku
   - statické assety (script/style/font/image): stale-while-revalidate
   - API a externé volania: nikdy sa necachujú
*/
const VERSION = "apw-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const SHELL_URLS = ["/", "/manifest.webmanifest", "/favicon.png", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(SHELL_URLS.map((url) => cache.add(new Request(url, { cache: "reload" }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function isCacheableAsset(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn")) return false;
  // WASM bundler náhľadu: veľký súbor, cachujeme, aby druhé otvorenie bolo okamžité.
  if (url.pathname.endsWith(".wasm")) return true;
  return ["script", "style", "font", "image", "manifest"].includes(request.destination);
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put("/", response.clone()).catch(() => {});
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match("/")) ?? offlineResponse();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    })
    .catch(() => undefined);
  if (cached) return cached;
  const fresh = await network;
  return fresh ?? Response.error();
}

function offlineResponse() {
  return new Response(
    "<!doctype html><meta charset=utf-8><title>Offline</title><body style=\"font:15px system-ui;padding:2rem\">Si offline a táto stránka ešte nie je uložená. Skús to znova, keď budeš online.</body>",
    { headers: { "content-type": "text/html; charset=utf-8" }, status: 200 },
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if (isCacheableAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") void self.skipWaiting();
});
