# Prompt Canvas — nahraj ZIP, vyskúšaj prompt na vlastnom projekte

Nová sekcia „Canvas“: používateľ nahrá ZIP svojho projektu, vidí file tree + editor, živý náhľad v iframe a môže na projekte skúšať prompty — najprv audit skóre podľa 7 kritérií, potom AI navrhne konkrétne zmeny kódu ako diff, ktorý sa dá prijať alebo zamietnuť. Nič sa nedeje „naživo“ v jeho pravom repozitári: všetko beží nad kópiou v prehliadači a v Cloude.

## Čo používateľ uvidí

1. **Nahranie ZIP** — drag & drop, rozbalenie priamo v prehliadači. Ignorujeme `node_modules`, `.git`, buildy a binárky; limit veľkosti súboru a počtu súborov, aby to zostalo rýchle.
2. **Canvas s tromi panelmi** — vľavo file tree, v strede editor súboru, vpravo živý náhľad projektu.
3. **Živý náhľad** — projekt sa bundluje priamo v prehliadači a beží v izolovanom iframe. Funguje pre frontend projekty (React/Vite/statické HTML+CSS+JS). Backend, databázy a natívne závislosti sa nespustia — v takom prípade panel zobrazí jasnú správu namiesto náhľadu.
4. **Prompt panel** — textové pole na prompt + výber súborov, ktoré sa majú vziať do kontextu. Dve akcie:
   - **Audit** — existujúci skórovací engine (7 kritérií) vyhodnotí prompt v kontexte projektu.
   - **Navrhnúť zmeny** — AI vráti navrhované úpravy súborov; zobrazí sa diff (starý vs. nový obsah) s tlačidlami Prijať / Zamietnuť. Prijatie zmien okamžite premietne do náhľadu.
5. **Verzie** — každé prijaté kolo zmien je snapshot; možnosť vrátiť sa na predchádzajúcu verziu a exportovať výsledok ako nový ZIP.
6. **Ukladanie do Cloudu** — projekty, súbory a verzie sú uložené pod prihláseným účtom, takže sa dá vrátiť k práci z iného zariadenia.

## Backend (Lovable Cloud)

Zapneme Lovable Cloud: databáza, prihlásenie (e-mail + heslo) a serverové funkcie.

Tabuľky (všetky s RLS na `auth.uid()`, prístup len k vlastným záznamom):
- `canvas_projects` — id, user_id, názov, čas vytvorenia/úpravy
- `canvas_files` — project_id, cesta, obsah (text), unique (project_id, path)
- `canvas_versions` — project_id, číslo verzie, prompt, snapshot súborov (jsonb), skóre auditu
- `canvas_prompt_runs` — project_id, version_id, prompt, typ (audit / change), výsledok

Canvas bude pod prihlásenou časťou aplikácie; neprihlásený používateľ sa presmeruje na `/auth`.

## Technické detaily

- Rozbalenie ZIP: `jszip` v prehliadači; export ZIP tou istou knižnicou.
- Živý náhľad: `@codesandbox/sandpack-react` v režime, kde dostane súbory z canvasu; renderované len po hydratácii (`ClientOnly` + `React.lazy`), aby SSR nespadol.
- AI zmeny: `createServerFn` (`src/lib/canvas-ai.functions.ts`) s `.middleware([requireSupabaseAuth])`, volá Lovable AI Gateway (`google/gemini-3-flash`) a vracia štruktúrovaný zoznam `{ path, newContent, reason }`. Limit počtu a veľkosti súborov v kontexte, aby požiadavka nepretiekla.
- Diff: rozšírime existujúci `src/lib/diff.ts` na porovnanie po riadkoch pre viac súborov.
- Perzistencia: `src/lib/canvas.functions.ts` — uloženie projektu a súborov, zoznam projektov, načítanie verzie, rollback.
- Nová route `src/routes/_authenticated/canvas.tsx` (+ položka v navigácii `AppShell`), vlastné `head()` meta.
- Audit v kontexte projektu používa existujúci `analyzePrompt` z `src/lib/criteria.ts`, žiadne duplikovanie logiky.

## Hranice, ktoré treba priznať

- V náhľade nespustíme `npm install` ani reálny dev server — bundling je v prehliadači, takže projekty s ťažkými alebo natívnymi závislosťami sa nezobrazia.
- Backendové časti nahraného projektu (API, DB migrácie) sa dajú prezerať a upravovať, ale nespustia.
- Veľmi veľké repozitáre (tisíce súborov) budú obmedzené limitom pri importe.

## Poradie prác

1. Zapnutie Cloudu + migrácia tabuliek a RLS, prihlásenie.
2. Import ZIP + file tree + editor (bez AI a bez náhľadu).
3. Živý náhľad v iframe.
4. Prompt panel: audit → AI zmeny → diff → prijatie.
5. Verzie, rollback, export ZIP.
