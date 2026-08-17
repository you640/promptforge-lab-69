import type { CanvasFile } from "./canvas-types";

/**
 * Lokálna cache rozbalených ZIP súborov v IndexedDB.
 * Po opätovnom otvorení canvasu sa projekt vykreslí okamžite z cache,
 * kým na pozadí dobehne načítanie z cloudu.
 */
const DB_NAME = "apw-canvas";
const DB_VERSION = 1;
const STORE = "projects";
const LAST_KEY = "apw.canvas.last-project";

interface CachedProject {
  projectId: string;
  name: string;
  files: CanvasFile[];
  updatedAt: number;
}

function hasIDB() {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase | null> {
  if (!hasIDB()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "projectId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  if (!db) return null;
  return new Promise<T | null>((resolve) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
    t.oncomplete = () => db.close();
  });
}

export async function cacheProjectFiles(projectId: string, name: string, files: CanvasFile[]) {
  const value: CachedProject = { projectId, name, files, updatedAt: Date.now() };
  await tx("readwrite", (s) => s.put(value) as IDBRequest<IDBValidKey>);
}

export async function readCachedProject(projectId: string): Promise<CachedProject | null> {
  return (await tx<CachedProject>("readonly", (s) => s.get(projectId))) ?? null;
}

export async function dropCachedProject(projectId: string) {
  await tx("readwrite", (s) => s.delete(projectId) as unknown as IDBRequest<undefined>);
}

export function rememberLastProject(projectId: string | null) {
  if (typeof localStorage === "undefined") return;
  if (projectId) localStorage.setItem(LAST_KEY, projectId);
  else localStorage.removeItem(LAST_KEY);
}

export function loadLastProject(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(LAST_KEY);
}
