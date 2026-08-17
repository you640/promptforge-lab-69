import { Sandpack } from "@codesandbox/sandpack-react";
import type { CanvasFile } from "@/lib/canvas-types";

type Template = "react-ts" | "static" | "vanilla";

const REACT_ENTRIES = [
  "src/main.tsx",
  "src/index.tsx",
  "src/main.jsx",
  "src/index.jsx",
  "src/main.js",
  "src/index.js",
  "index.tsx",
  "index.jsx",
];

interface Picked {
  template: Template;
  reason: string;
  entry?: string;
}

function pickTemplate(files: CanvasFile[]): Picked | null {
  const paths = files.map((f) => f.path);
  const pkg = files.find((f) => f.path === "package.json");
  if (pkg && /"react"\s*:/.test(pkg.content)) {
    const entry = REACT_ENTRIES.find((p) => paths.includes(p));
    if (entry) return { template: "react-ts", reason: "React projekt", entry };
  }
  if (paths.includes("index.html")) return { template: "static", reason: "Statická stránka" };
  if (pkg) return { template: "vanilla", reason: "JavaScript projekt" };
  return null;
}

function dependencies(files: CanvasFile[]): Record<string, string> {
  const pkg = files.find((f) => f.path === "package.json");
  const base: Record<string, string> = {};
  if (!pkg) return base;
  try {
    const parsed = JSON.parse(pkg.content) as { dependencies?: Record<string, string> };
    return { ...base, ...(parsed.dependencies ?? {}) };
  } catch {
    return base;
  }
}

export default function LivePreview({ files }: { files: CanvasFile[] }) {
  const picked = pickTemplate(files);

  if (!picked) {
    return (
      <div className="grid h-[420px] place-items-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Tento projekt sa nedá spustiť v prehliadači — chýba <code>index.html</code> alebo{" "}
        <code>package.json</code> s Reactom. Súbory môžeš aj tak prezerať, upravovať a nechať si na
        ne navrhnúť zmeny.
      </div>
    );
  }

  const sandpackFiles: Record<string, string> = {};
  for (const f of files) {
    // package.json necháme mimo náhľadu — závislosti dodávame cez customSetup,
    // inak sa Sandpack pokúša spustiť dev server zo skriptov projektu.
    if (f.path === "package.json") continue;
    sandpackFiles[`/${f.path}`] = f.content;
  }

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">Režim náhľadu: {picked.reason}</p>
      <SandpackProvider
        key={picked.template + (picked.entry ?? "")}
        template={picked.template}
        files={sandpackFiles}
        customSetup={{
          dependencies: dependencies(files),
          ...(picked.entry ? { entry: `/${picked.entry}` } : {}),
        }}
        theme="auto"
        options={{ externalResources: [] }}
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton
          style={{ height: 480, borderRadius: 12 }}
        />
      </SandpackProvider>
    </div>
  );
}

