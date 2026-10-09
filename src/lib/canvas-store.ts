import type { CanvasFile, CanvasProject, CanvasVersion } from "./canvas-types";

/**
 * Lokálne úložisko Canvas projektov (localStorage) — bez prihlásenia.
 * Rozhranie ({ data }) zodpovedá pôvodným serverovým funkciám.
 */
export interface StoredProject {
  project: CanvasProject;
  files: CanvasFile[];
  versions: CanvasVersion[];
}

const KEY = "apw.canvas.projects.v1";

function readAll(): Record<string, StoredProject> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, StoredProject>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, StoredProject>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    throw new Error("Lokálne úložisko je plné — zmaž niektorý projekt.");
  }
}

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

export async function listCanvasProjects(_?: unknown): Promise<CanvasProject[]> {
  return Object.values(readAll())
    .map((p) => p.project)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function createCanvasProject({
  data,
}: {
  data: { name: string; files: CanvasFile[] };
}): Promise<CanvasProject> {
  const all = readAll();
  const t = now();
  const project: CanvasProject = {
    id: uid(),
    name: data.name,
    file_count: data.files.length,
    created_at: t,
    updated_at: t,
  };
  all[project.id] = {
    project,
    files: data.files,
    versions: [
      { id: uid(), version: 1, prompt: "Import ZIP", audit_score: null, created_at: t, files: data.files },
    ],
  };
  writeAll(all);
  return project;
}

export async function getCanvasProject({ data }: { data: { projectId: string } }) {
  const p = readAll()[data.projectId];
  if (!p) throw new Error("Projekt sa nenašiel");
  return {
    project: p.project,
    files: [...p.files].sort((a, b) => a.path.localeCompare(b.path)),
    versions: [...p.versions].sort((a, b) => b.version - a.version),
  };
}

export async function deleteCanvasProject({ data }: { data: { projectId: string } }) {
  const all = readAll();
  delete all[data.projectId];
  writeAll(all);
  return { ok: true };
}

export async function saveCanvasFile({
  data,
}: {
  data: { projectId: string; path: string; content: string };
}) {
  const all = readAll();
  const p = all[data.projectId];
  if (!p) throw new Error("Projekt sa nenašiel");
  const i = p.files.findIndex((f) => f.path === data.path);
  if (i >= 0) p.files[i] = { path: data.path, content: data.content };
  else p.files.push({ path: data.path, content: data.content });
  p.project.file_count = p.files.length;
  p.project.updated_at = now();
  writeAll(all);
  return { ok: true };
}

export async function commitCanvasVersion({
  data,
}: {
  data: { projectId: string; prompt?: string; auditScore?: number | null; files: CanvasFile[] };
}): Promise<CanvasVersion> {
  const all = readAll();
  const p = all[data.projectId];
  if (!p) throw new Error("Projekt sa nenašiel");
  const last = p.versions.reduce((m, v) => Math.max(m, v.version), 0);
  const version: CanvasVersion = {
    id: uid(),
    version: last + 1,
    prompt: data.prompt ?? "",
    audit_score: data.auditScore ?? null,
    created_at: now(),
    files: data.files,
  };
  p.versions.push(version);
  p.files = data.files;
  p.project.file_count = data.files.length;
  p.project.updated_at = now();
  writeAll(all);
  return version;
}

export async function logCanvasPromptRun(_: unknown) {
  return { ok: true };
}

/** Uloží projekt prenesený z cloudu (zachová pôvodné id); existujúci lokálny neprepíše. */
export function importStoredProject(entry: StoredProject): boolean {
  const all = readAll();
  if (all[entry.project.id]) return false;
  all[entry.project.id] = entry;
  writeAll(all);
  return true;
}
