import type { CanvasFile } from "./canvas-types";

/** Celkový rozpočet znakov kontextu pre AI (celý projekt, kým sa zmestí). */
export const AI_TOTAL_CHARS = 600_000;
/** Max. dĺžka jedného súboru v kontexte. */
export const AI_FILE_CHARS = 60_000;

export interface AiContext {
  files: CanvasFile[];
  /** Súbory, ktoré sa nezmestili — AI dostane aspoň ich cesty. */
  omitted: string[];
}

const LOW_VALUE = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?)$|\.min\.(js|css)$|\.svg$/i;

function score(file: CanvasFile, words: string[], selected: Set<string>): number {
  if (selected.has(file.path)) return 1_000;
  const p = file.path.toLowerCase();
  const c = file.content.toLowerCase();
  let s = 0;
  for (const w of words) {
    if (p.includes(w)) s += 20;
    if (c.includes(w)) s += 3;
  }
  if (/^(src\/)?(main|index|app)\.[jt]sx?$|(^|\/)index\.html$|(^|\/)package\.json$/i.test(file.path)) s += 40;
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
  const ranked = [...files].sort(
    (a, b) => score(b, words, selected) - score(a, words, selected) || a.path.localeCompare(b.path),
  );
  const out: CanvasFile[] = [];
  const omitted: string[] = [];
  let used = 0;
  for (const f of ranked) {
    const content = f.content.slice(0, AI_FILE_CHARS);
    if (used + content.length > budget || LOW_VALUE.test(f.path)) {
      omitted.push(f.path);
      continue;
    }
    used += content.length;
    out.push({ path: f.path, content });
  }
  return { files: out, omitted };
}
