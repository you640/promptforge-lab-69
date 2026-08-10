# Auditor Promptov pre PWA

Inštalovateľná PWA na analýzu, hodnotenie a vylepšovanie promptov pre PWA aplikácie podľa 7 kritérií:
špecifikácia, technická presnosť, UX/UI, výkon, testovanie, nasadenie, kreativita.

## Funkcie

- **Dashboard** – prehľad skóre, priemer auditov, odporúčania
- **Analyzátor** – editor promptu s bodovaním v reálnom čase, checklisty, auto-vylepšenie, diff viewer, export PDF
- **Detail kritérií** – váhy, checklisty a odborné tipy
- **Návrhy a šablóny** – knižnica promptov + CI/CD workflow šablóna
- **Testovací sandbox** – A/B porovnanie dvoch verzií promptu a odhad Lighthouse skóre (offline)
- **História & reporty** – archív auditov, export CSV / JSON
- **Nastavenia & tím** – autor, tím, notifikácie, minimálne akceptačné skóre
- **Pomoc a vzdelávanie** – príručka a FAQ

## Technológie

React 19 + TypeScript, TanStack Start (Vite 7), Tailwind CSS v4, jsPDF, Papa Parse, lucide-react, shadcn/ui.

Dizajn tokeny (`src/styles.css`): `#0B74FF` primary, `#00C48C` accent, `#F6F8FA` surface, `#12263A` ink.

## PWA

- `public/manifest.webmanifest` (standalone, ikony 192/512/maskable, theme color `#0B74FF`)
- inštalácia na domovskú obrazovku (Chrome/Edge: ikona v adresnom riadku, iOS Safari: Zdieľať → Pridať na plochu)
- všetky dáta (audity, nastavenia, koncept promptu) sú v `localStorage`, analýza beží plne lokálne bez siete

## Vývoj

```bash
bun install
bun run dev     # http://localhost:8080
bun run build
```

## Štruktúra

```
src/
  lib/criteria.ts    # 7 kritérií + skórovací engine + auto-vylepšenie
  lib/diff.ts        # LCS diff po riadkoch
  lib/export.ts      # PDF / CSV / JSON export
  lib/templates.ts   # knižnica šablón
  lib/storage.ts     # história a nastavenia (localStorage)
  components/        # AppShell, ScoreVisuals, shadcn/ui
  routes/            # index, analyzator, kriteria, sablony, sandbox, historia, nastavenia, pomoc
```

## Ďalšie kroky (nezahrnuté v tejto verzii)

- prihlásenie (OAuth2/JWT) a tímové zdieľanie auditov cez Lovable Cloud
- reálna Lighthouse API integrácia namiesto lokálneho odhadu
- service worker cache (Workbox) pre plné offline cachovanie assetov
