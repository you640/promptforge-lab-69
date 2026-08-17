export interface CanvasFile {
  path: string;
  content: string;
}

export interface CanvasProject {
  id: string;
  name: string;
  file_count: number;
  created_at: string;
  updated_at: string;
}

export interface CanvasVersion {
  id: string;
  version: number;
  prompt: string;
  audit_score: number | null;
  created_at: string;
  files: CanvasFile[];
}

export interface ProposedChange {
  path: string;
  newContent: string;
  reason: string;
}

export const MAX_FILES = 300;
export const MAX_FILE_BYTES = 120_000;
export const AI_CONTEXT_FILES = 12;
export const AI_CONTEXT_CHARS = 6_000;

const SKIP_DIRS = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  ".next/",
  ".cache/",
  "coverage/",
  ".turbo/",
  "__MACOSX/",
];

const TEXT_EXT = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "json",
  "css",
  "scss",
  "html",
  "md",
  "txt",
  "yml",
  "yaml",
  "svg",
  "env",
  "toml",
  "webmanifest",
];

export function isSkippedPath(path: string): boolean {
  const p = path.replace(/^\/+/, "");
  if (SKIP_DIRS.some((d) => p.includes(d))) return true;
  if (p.split("/").some((s) => s.startsWith("."))) return p.endsWith(".env.example");
  return false;
}

export function isTextFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_EXT.includes(ext);
}

export function normalizePath(path: string): string {
  return path.replace(/^\/+/, "");
}

/** Ak je celý projekt v jednom koreňovom priečinku, odstráni ho z ciest. */
export function stripCommonRoot(files: CanvasFile[]): CanvasFile[] {
  if (files.length === 0) return files;
  const first = files[0]?.path.split("/")[0];
  if (!first) return files;
  const shared = files.every((f) => f.path.split("/")[0] === first && f.path.includes("/"));
  if (!shared) return files;
  return files.map((f) => ({ ...f, path: f.path.slice(first.length + 1) }));
}
