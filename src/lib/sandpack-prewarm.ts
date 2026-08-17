/**
 * Prewarm pre Sandpack náhľad.
 *
 * Sandpack beží v iframe na CDN CodeSandboxu a závislosti tahá z npm CDN.
 * Prvé spustenie tak platí DNS + TLS + stiahnutie bundleru. Tieto veci vieme
 * pripraviť dopredu (hneď po otvorení Canvasu), takže po prepnutí na kartu
 * „Živý náhľad“ zostane len samotný build projektu.
 */

export const SANDPACK_BUNDLER_URL = "https://2-19-8-sandpack.codesandbox.io";

const WARM_ORIGINS = [
  SANDPACK_BUNDLER_URL,
  "https://prod-packager-packages.codesandbox.io",
  "https://unpkg.com",
];

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

/** Idempotentne pripraví sieťové spojenia a kód náhľadu. */
export function prewarmSandpack(): void {
  if (started || typeof document === "undefined") return;
  started = true;

  for (const origin of WARM_ORIGINS) {
    addLink("dns-prefetch", origin, false);
    addLink("preconnect", origin);
  }

  // Načíta chunk s náhľadom (a knižnicu Sandpacku) skôr, než ho používateľ otvorí.
  void import("@/components/canvas/LivePreview").catch(() => undefined);

  // Zahreje HTTP cache bundleru; odpoveď nepotrebujeme, len spojenie a súbor.
  void fetch(`${SANDPACK_BUNDLER_URL}/`, { mode: "no-cors", credentials: "omit" }).catch(
    () => undefined,
  );
}
