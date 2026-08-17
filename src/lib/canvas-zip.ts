import JSZip from "jszip";
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  isSkippedPath,
  isTextFile,
  normalizePath,
  stripCommonRoot,
  type CanvasFile,
} from "./canvas-types";

export interface ImportResult {
  files: CanvasFile[];
  skipped: number;
}

/** Rozbalí ZIP v prehliadači a vráti len textové súbory projektu. */
export async function importZip(file: File): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((e) => !e.dir);
  const out: CanvasFile[] = [];
  let skipped = 0;

  for (const entry of entries) {
    const path = normalizePath(entry.name);
    if (!path || isSkippedPath(path) || !isTextFile(path)) {
      skipped++;
      continue;
    }
    if (out.length >= MAX_FILES) {
      skipped++;
      continue;
    }
    const content = await entry.async("string");
    if (content.length > MAX_FILE_BYTES) {
      skipped++;
      continue;
    }
    out.push({ path, content });
  }

  out.sort((a, b) => a.path.localeCompare(b.path));
  return { files: stripCommonRoot(out), skipped };
}

/** Zabalí aktuálny stav canvasu späť do ZIP a stiahne ho. */
export async function exportZip(name: string, files: CanvasFile[]) {
  const zip = new JSZip();
  for (const f of files) zip.file(f.path, f.content);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/[^\w.-]+/g, "-") || "canvas"}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
