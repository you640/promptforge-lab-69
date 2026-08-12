import type { AnalysisResult } from "./criteria";

export interface HistoryEntry {
  id: string;
  title: string;
  prompt: string;
  total: number;
  grade: string;
  createdAt: string;
  scores: { id: string; score: number }[];
}

const KEY = "apw.history.v1";
const SETTINGS_KEY = "apw.settings.v1";

export interface Settings {
  authorName: string;
  teamName: string;
  notifications: boolean;
  autoAnalyze: boolean;
  minScore: number;
}

export const defaultSettings: Settings = {
  authorName: "",
  teamName: "PWA Guild",
  notifications: false,
  autoAnalyze: true,
  minScore: 75,
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveEntry(title: string, prompt: string, result: AnalysisResult): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    title: title || "Bez názvu",
    prompt,
    total: result.total,
    grade: result.grade,
    createdAt: new Date().toISOString(),
    scores: result.scores.map((s) => ({ id: s.id, score: s.score })),
  };
  const next = [entry, ...loadHistory()].slice(0, 100);
  if (isBrowser()) localStorage.setItem(KEY, JSON.stringify(next));
  return entry;
}

export function deleteEntry(id: string) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(loadHistory().filter((e) => e.id !== id)));
}

export function clearHistory() {
  if (isBrowser()) localStorage.removeItem(KEY);
}

export function loadSettings(): Settings {
  if (!isBrowser()) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: Settings) {
  if (isBrowser()) localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export const DRAFT_KEY = "apw.draft.v1";

const LH_KEY = "apw.lighthouse.v1";

export function saveLighthouseAudits<T>(audits: T[]) {
  if (isBrowser()) localStorage.setItem(LH_KEY, JSON.stringify(audits));
}

export function loadLighthouseAudits<T>(): T[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(LH_KEY) ?? "[]") as T[];
  } catch {
    return [];
  }
}
