# Živý náhľad o 3 levely vyššie — vlastný náhľad bez externého bundleru

Dnes náhľad závisí na CodeSandbox bundleri (`https://2-19-8-sandpack.codesandbox.io`) v `src/components/canvas/LivePreview.tsx`: prvý štart trvá sekundy a projekt bez `index.html` alebo React entry pointu (`pickTemplate` vráti `null`) sa nespustí vôbec. Riešenie: postaviť vlastný náhľad, ktorý beží celý v prehliadači používateľa.

## Level 1 — Vlastný in-browser bundler (žiadny externý server)

- Kompilácia cez `esbuild-wasm` priamo v prehliadači: jeden malý WASM balík, načítaný a inicializovaný raz pri otvorení Canvasu (nahradí dnešný prewarm).
- Súbory z canvasu sa riešia z pamäti (virtuálny filesystem), npm závislosti sa mapujú na `esm.sh` importmapou — žiadny `npm install`, žiadny cudzí bundler.
- Výsledok sa vloží do izolovaného `iframe` (`sandbox`, `srcdoc`/blob) — spustenie po prvom warm-upe v desiatkach až stovkách ms, ďalšie buildy inkrementálne.
- Funguje aj offline pre projekty bez externých závislostí (esbuild WASM sa cachuje service workerom).

## Level 2 — Každý projekt sa dá zobraziť (žiadne „nedá sa spustiť“)

Kaskáda režimov namiesto jedinej hlášky:
1. **React/Vue-less JSX/TS entry** — nájdený entry (`src/main.*`, `index.*`) → bundle a render.
2. **Statické HTML** — `index.html` (aj vnorené, napr. `public/index.html`, `docs/index.html`) → priamo do iframe, lokálne `<script>`/`<link>` prepojené na súbory z canvasu.
3. **Bez entry pointu, ale s komponentom** — používateľ v file tree označí ľubovoľný `.tsx/.jsx` súbor ako „Spusti tento komponent“; vygenerujeme dočasný entry a vyrenderujeme len ten komponent (component playground).
4. **Bez UI kódu** — náhľad prepne na čitateľný render: Markdown (README) ako formátovaný dokument, JSON/YAML ako strom, CSS ako živú ukážku štýlov, obrázky/SVG ako galériu.
5. **Backend/iné** — jasne pojmenovaný stav so zoznamom dôvodov (napr. „server-only kód, chýba UI entry“) + tlačidlo na režim 3.

## Level 3 — Použiteľnosť náhľadu

- **Auto-refresh pri editácii** — debounce ~400 ms, rebuild bez straty stavu iframe, indikátor „Buduje sa / Aktuálne“.
- **Konzola náhľadu** — zachytené `console.*`, runtime chyby a chyby buildu s cestou k súboru a riadkom, klik skočí do editora na dané miesto.
- **Error overlay** — čitateľná chybová hláška v náhľade namiesto bielej stránky.
- **Ovládanie zobrazenia** — prepínač mobil/tablet/desktop, otvoriť náhľad v novom okne, reload.
- **Zapamätaný stav** — vybraný režim náhľadu a entry point sa držia na projekt (IndexedDB cache, ktorú už používame).

## Technické detaily

- Nová závislosť: `esbuild-wasm`. Sandpack zostane ako dočasný fallback len na React projekty, kým nový bundler neprejde testom; ak sa osvedčí, odstránime aj `@codesandbox/sandpack-react` a `src/lib/sandpack-prewarm.ts`.
- Nové moduly: `src/lib/preview/bundler.ts` (esbuild init + build, virtuálny FS plugin), `src/lib/preview/resolve.ts` (importmapa na esm.sh, detekcia závislostí z `package.json` aj z importov), `src/lib/preview/mode.ts` (kaskáda režimov z Level 2), `src/components/canvas/PreviewFrame.tsx` (iframe, postMessage protokol, konzola, overlay), `src/components/canvas/PreviewConsole.tsx`.
- `LivePreview.tsx` sa stane tenkým prepínačom režimov; načítanie zostáva `React.lazy` + `ClientOnly`, aby SSR nespadol (esbuild-wasm sa importuje až v prehliadači, nikdy v module scope).
- Karta náhľadu zostáva `forceMount`, iframe teda prežije prepínanie kariet.
- Service worker (`public/sw.js`) dostane cache pravidlo pre WASM balík, aby druhé otvorenie bolo okamžité.

## Hranice, ktoré priznávame

- Beží len frontend kód. Server funkcie, DB migrácie a natívne závislosti sa nespustia — zobrazia sa v režime 4/5.
- Závislosti sa tahajú z `esm.sh`, takže balík bez ESM buildu (alebo čisto Node-only) v náhľade nepôjde; konzola to pomenuje konkrétnym balíkom.
- Veľmi veľké projekty (stovky súborov) budú mať prvý build v sekundách, ďalšie inkrementálne.

## Poradie prác

1. esbuild-wasm bundler + iframe render pre React/JSX projekty (nahradí Sandpack cestu).
2. Kaskáda režimov vrátane HTML, component playgroundu a dokumentových režimov.
3. Auto-refresh, konzola, error overlay, prepínač zariadení a zapamätanie režimu.
4. Overenie v prehliadači na troch typoch ZIP-u (React app, statické HTML, projekt bez UI entry) a odstránenie Sandpacku.
