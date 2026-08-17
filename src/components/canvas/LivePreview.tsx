import { Sandpack } from "@codesandbox/sandpack-react";
import type { CanvasFile } from "@/lib/canvas-types";

type Template = "vite-react-ts" | "static" | "vanilla";

function pickTemplate(files: CanvasFile[]): { template: Template; reason: string } | null {
  const paths = files.map((f) => f.path);
  const pkg = files.find((f) => f.path === "package.json");
  if (pkg) {
    if (/"react"\s*:/.test(pkg.content) && paths.some((p) => p.startsWith("src/"))) {
      return { template: "vite-react-ts", reason: "React / Vite projekt" };
    }
    return { template: "vanilla", reason: "JavaScript projekt" };
  }
  if (paths.includes("index.html")) return { template: "static", reason: "Statická stránka" };
  return null;
}

function dependencies(files: CanvasFile[]): Record<string, string> {
  const pkg = files.find((f) => f.path === "package.json");
  if (!pkg) return {};
  try {
    const parsed = JSON.parse(pkg.content) as { dependencies?: Record<string, string> };
    return parsed.dependencies ?? {};
  } catch {
    return {};
  }
}

export default function LivePreview({ files }: { files: CanvasFile[] }) {
  const picked = pickTemplate(files);

  if (!picked) {
    return (
      <div className="grid h-[420px] place-items-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Tento projekt sa nedá spustiť v prehliadači — chýba <code>index.html</code> alebo{" "}
        <code>package.json</code>. Súbory môžeš aj tak prezerať, upravovať a nechať si na ne
        navrhnúť zmeny.
      </div>
    );
  }

  const sandpackFiles: Record<string, string> = {};
  for (const f of files) sandpackFiles[`/${f.path}`] = f.content;

  // Sandpack potrebuje v package.json spúšťací skript, inak náhľad nenaštartuje.
  const pkgFile = sandpackFiles["/package.json"];
  if (pkgFile) {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(pkgFile) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
    const scripts = (parsed["scripts"] as Record<string, string> | undefined) ?? {};
    parsed["name"] = typeof parsed["name"] === "string" ? parsed["name"] : "canvas-preview";
    parsed["scripts"] = {
      ...scripts,
      dev: scripts["dev"] ?? "vite",
      start: scripts["start"] ?? scripts["dev"] ?? "vite",
      build: scripts["build"] ?? "vite build",
    };
    sandpackFiles["/package.json"] = JSON.stringify(parsed, null, 2);
  }


  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">Režim náhľadu: {picked.reason}</p>
      <Sandpack
        template={picked.template}
        files={sandpackFiles}
        customSetup={{ dependencies: dependencies(files) }}
        options={{
          showTabs: false,
          showLineNumbers: false,
          editorHeight: 0,
          layout: "preview",
          externalResources: [],
        }}
        theme="auto"
      />
    </div>
  );
}
