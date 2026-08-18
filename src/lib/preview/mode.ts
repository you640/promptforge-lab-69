import type { CanvasFile } from "@/lib/canvas-types";

export type PreviewMode = "react" | "html" | "component" | "docs" | "none";

export interface PreviewPlan {
  mode: PreviewMode;
  label: string;
  /** Entry point pre react režim, HTML súbor pre html režim, komponent pre component režim. */
  target?: string;
  /** Kandidáti na „Spusti tento komponent". */
  components: string[];
  /** Dôvody, prečo nejde plný beh projektu. */
  notes: string[];
}

const REACT_ENTRIES = [
  "src/main.tsx",
  "src/main.jsx",
  "src/main.ts",
  "src/main.js",
  "src/index.tsx",
  "src/index.jsx",
  "src/index.js",
  "index.tsx",
  "index.jsx",
  "src/App.tsx",
  "src/app.tsx",
];

const HTML_CANDIDATES = ["index.html", "public/index.html", "docs/index.html", "src/index.html"];

const COMPONENT_RE = /\.(tsx|jsx)$/;

export function findComponents(files: CanvasFile[]): string[] {
  return files
    .filter((f) => COMPONENT_RE.test(f.path))
    .filter((f) => /export\s+default|export\s+(function|const)\s+[A-Z]/.test(f.content))
    .map((f) => f.path)
    .sort((a, b) => a.length - b.length)
    .slice(0, 40);
}

export function findHtml(files: CanvasFile[]): string | undefined {
  const paths = new Set(files.map((f) => f.path));
  const preferred = HTML_CANDIDATES.find((p) => paths.has(p));
  return preferred ?? files.find((f) => f.path.endsWith(".html"))?.path;
}

function hasDocs(files: CanvasFile[]): boolean {
  return files.some((f) => /\.(md|json|css|svg|ya?ml|txt)$/i.test(f.path));
}

/** Kaskáda režimov: vždy sa snažíme používateľovi niečo zobraziť. */
export function planPreview(files: CanvasFile[]): PreviewPlan {
  const components = findComponents(files);
  const notes: string[] = [];
  if (files.length === 0) {
    return { mode: "none", label: "Prázdny projekt", components, notes: ["Projekt neobsahuje súbory."] };
  }

  const paths = new Set(files.map((f) => f.path));
  const reactEntry = REACT_ENTRIES.find((p) => paths.has(p));
  const html = findHtml(files);

  if (reactEntry) {
    return { mode: "react", label: "React aplikácia", target: reactEntry, components, notes };
  }
  if (html) {
    return { mode: "html", label: "Statická stránka", target: html, components, notes };
  }
  if (components.length > 0) {
    notes.push("Projekt nemá entry point, spúšťame vybraný komponent samostatne.");
    return { mode: "component", label: "Komponent", target: components[0]!, components, notes };
  }
  if (hasDocs(files)) {
    notes.push("V projekte nie je frontend entry point ani komponent na spustenie.");
    return { mode: "docs", label: "Dokumenty a assety", components, notes };
  }
  notes.push("Projekt obsahuje len kód, ktorý sa v prehliadači nedá spustiť (server / konfigurácia).");
  return { mode: "none", label: "Nespustiteľné v prehliadači", components, notes };
}

/** Virtuálny entry pre režim „spusti komponent". */
export const COMPONENT_ENTRY = "__canvas_preview_entry.tsx";

export function componentEntryFile(componentPath: string): CanvasFile {
  const rel = `/${componentPath}`;
  return {
    path: COMPONENT_ENTRY,
    content: `import { createRoot } from "react-dom/client";
import * as mod from "${rel}";

const Component =
  (mod as any).default ??
  Object.values(mod).find((v) => typeof v === "function");

const el = document.getElementById("root") ?? document.body;
if (!Component) {
  el.innerHTML = '<p style="font:14px system-ui;padding:1rem">Súbor ${componentPath} neexportuje komponent.</p>';
} else {
  createRoot(el).render(<Component />);
}
`,
  };
}
