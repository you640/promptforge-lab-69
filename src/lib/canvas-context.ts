import type { CanvasFile } from "./canvas-types";

/** Celkový rozpočet znakov kontextu pre AI (celý projekt, kým sa zmestí). */
export const AI_TOTAL_CHARS = 600_000;
/** Max. dĺžka jedného súboru v kontexte. */
export const AI_FILE_CHARS = 120_000;

export interface AiContext {
  files: CanvasFile[];
  /** Súbory, ktoré sa nezmestili — AI dostane aspoň ich cesty. */
  omitted: string[];
}

const LOW_VALUE = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?)$|\.min\.(js|css)$|\.svg$/i;
const PROJECT_STRUCTURE = /(^|\/)(package\.json|index\.html|(?:main|app|index|layout|__root)\.[jt]sx?|(?:styles?|globals?|theme|tokens)\.(css|scss)|(?:vite|tailwind)\.config\.[jt]s|tsconfig\.json)$/i;
const BROAD_CHANGE = /štýl|styl|style|dizajn|design|layout|rozlož|rozloz|redesign|tém[ay]|theme|interakti|interactive|komponent|component/i;

function score(file: CanvasFile, words: string[], selected: Set<string>, broad: boolean): number {
  if (selected.has(file.path)) return 1_000;
  const p = file.path.toLowerCase();
  const c = file.content.toLowerCase();
  let s = 0;
  for (const w of words) {
    if (p.includes(w)) s += 20;
    if (c.includes(w)) s += 3;
  }
  if (/^(src\/)?(main|index|app)\.[jt]sx?$|(^|\/)index\.html$|(^|\/)package\.json$/i.test(file.path)) s += 40;
  if (PROJECT_STRUCTURE.test(file.path)) s += 100;
  if (broad && /\.(css|scss|tsx|jsx|html)$/.test(file.path)) s += 50;
  if (LOW_VALUE.test(file.path)) s -= 100;
  return s;
}

/** Vyberie súbory pre AI: zaškrtnuté prvé, potom podľa relevancie k promptu, až po rozpočet. */
export function buildAiContext(
  files: CanvasFile[],
  prompt: string,
  selectedPaths: string[] = [],
  budget = AI_TOTAL_CHARS,
): AiContext {
  const words = Array.from(
    new Set(prompt.toLowerCase().match(/[\p{L}\d_-]{4,}/gu) ?? []),
  ).slice(0, 40);
  const selected = new Set(selectedPaths);
  const broad = BROAD_CHANGE.test(prompt);
  const ranked = [...files].sort(
    (a, b) => score(b, words, selected, broad) - score(a, words, selected, broad) || a.path.localeCompare(b.path),
  );
  const out: CanvasFile[] = [];
  const omitted: string[] = [];
  let used = 0;
  for (const f of ranked) {
    const content = f.content;
    if (content.length > AI_FILE_CHARS || used + content.length > budget || out.length >= 300 || (LOW_VALUE.test(f.path) && !selected.has(f.path))) {
      omitted.push(f.path);
      continue;
    }
    used += content.length;
    out.push({ path: f.path, content });
  }
  return { files: out, omitted };
}
