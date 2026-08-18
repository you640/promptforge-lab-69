/**
 * Prewarm náhľadu: WASM bundler a CDN pre závislosti pripravíme hneď po
 * otvorení Canvasu, takže prvý build po prepnutí na kartu je okamžitý.
 */
let started = false;

function addLink(rel: string, href: string, crossOrigin = true) {
  const selector = `link[rel="${rel}"][href="${href}"]`;
  if (document.head.querySelector(selector)) return;
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  if (crossOrigin) link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

export function prewarmPreview(): void {
  if (started || typeof document === "undefined") return;
  started = true;

  for (const origin of ["https://esm.sh", "https://cdn.tailwindcss.com"]) {
    addLink("dns-prefetch", origin, false);
    addLink("preconnect", origin);
  }

  void import("@/components/canvas/LivePreview")
    .then((mod) => mod)
    .catch(() => undefined);

  void import("@/lib/preview/bundler")
    .then((mod) => mod.initBundler())
    .catch(() => undefined);
}
