export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  body: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "pwa-full",
    name: "Kompletná PWA aplikácia",
    category: "PWA",
    description: "Univerzálny prompt pre inštalovateľnú offline PWA s plným stackom.",
    body: `Rola: Senior Full-Stack Developer & UX Architect.

Cieľ: Vytvor inštalovateľnú offline PWA "<NÁZOV>" pre <CIEĽOVÁ SKUPINA>.

Sekcie:
- Dashboard s prehľadom metrík
- Hlavný pracovný nástroj
- História a reporty
- Nastavenia

Technológie: React + TypeScript + Vite, Tailwind CSS, Workbox, Supabase.

UX/UI: paleta #0B74FF, #00C48C, #F6F8FA, #12263A; responzívne 360–1920 px; WCAG AA.

Výkon: Lighthouse ≥ 90, LCP < 2.5 s, lazy loading, cache-first pre statické assety.

Testovanie: Vitest unit testy, Playwright E2E pre kritické flows, pokrytie ≥ 70 %.

Nasadenie: GitHub Actions (install → lint → test → build → deploy), Netlify/Vercel, env premenné v CI.

Akceptačné kritériá: aplikácia je inštalovateľná, funguje offline, prejde Lighthouse PWA auditom.`,
  },
  {
    id: "offline-first",
    name: "Offline-first dátová aplikácia",
    category: "Offline",
    description: "Prompt zameraný na synchronizáciu a cache stratégie.",
    body: `Vytvor offline-first aplikáciu s lokálnou databázou (IndexedDB) a synchronizáciou pri obnovení pripojenia.

Technicky: Workbox (NetworkFirst pre navigácie, CacheFirst pre hashované assety), background sync queue, konflikt riešený last-write-wins s auditom.

UX: indikátor stavu pripojenia, front rady nesynchronizovaných zmien, optimistické UI.

Testovanie: simulácia offline v Playwright, unit testy sync reducera.

Akceptačné kritériá: dáta zadané offline sa po pripojení odošlú bez straty.`,
  },
  {
    id: "auth-flow",
    name: "Autentifikácia OAuth2 / JWT",
    category: "Bezpečnosť",
    description: "Prompt pre bezpečný prihlasovací tok a role.",
    body: `Implementuj autentifikáciu: email+password a OAuth2 (Google).

Bezpečnosť: JWT v httpOnly cookie alebo bezpečnom storage, refresh rotácia, role v samostatnej tabuľke user_roles, RLS politiky viazané na auth.uid().

UX: prihlásenie, registrácia, reset hesla so samostatnou stránkou /reset-password, chybové stavy a loading.

Akceptačné kritériá: neprihlásený používateľ sa nedostane k chráneným dátam ani cez priame API volanie.`,
  },
  {
    id: "audit-lighthouse",
    name: "Výkonový audit a Lighthouse",
    category: "Výkon",
    description: "Prompt pre optimalizáciu a merateľné metriky.",
    body: `Vykonaj výkonovú optimalizáciu aplikácie a nastav merateľné cieľe.

Metriky: Performance ≥ 90, LCP < 2.5 s, CLS < 0.1, TBT < 200 ms, PWA audit 100.

Kroky: analýza bundle, code splitting po routách, preload kritických fontov, responsive obrázky (AVIF/WebP), odstránenie nepoužitého CSS.

Reporting: Lighthouse CI v pipeline s budgetom, ktorý zlyhá build pri regresii.`,
  },
  {
    id: "cicd",
    name: "CI/CD pipeline šablóna",
    category: "Nasadenie",
    description: "GitHub Actions workflow pre PWA.",
    body: `name: ci
on:
  push: { branches: [main] }
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --run
      - run: npm run build
      - name: Lighthouse
        run: npx @lhci/cli autorun --collect.staticDistDir=dist`,
  },
  {
    id: "design-system",
    name: "Dizajn systém a tokeny",
    category: "UX/UI",
    description: "Prompt pre konzistentný vizuálny jazyk.",
    body: `Navrhni dizajn systém: semantické tokeny (background, foreground, primary, accent, success, warning), 4/8 px spacing scale, radius 10 px, dve úrovne elevácie.

Typografia: display font pre nadpisy, neutrálny sans pre text, škála 12/14/16/20/28/40 px.

Komponenty: button (primary/secondary/ghost), card, input, badge, tabs, empty state, skeleton.

Pravidlá: žiadne hardcoded farby v komponentoch, len tokeny; kontrast WCAG AA.`,
  },
];
