import type { CanvasFile } from "@/lib/canvas-types";
import { esmUrl, readDependencies } from "./resolve";

/**
 * Bundler náhľadu: esbuild-wasm beží priamo v prehliadači nad súbormi
 * z canvasu (virtuálny filesystem), npm závislosti idú na esm.sh.
 * Žiadny externý bundler, žiadny npm install.
 */

type Esbuild = typeof import("esbuild-wasm");

let ready: Promise<Esbuild> | null = null;

export function initBundler(): Promise<Esbuild> {
  if (!ready) {
    ready = (async () => {
      const [esbuild, wasm] = await Promise.all([
        import("esbuild-wasm"),
        import("esbuild-wasm/esbuild.wasm?url"),
      ]);
      await esbuild.initialize({ wasmURL: wasm.default, worker: true });
      return esbuild;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const JS_EXT = ["", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".json", ".css"];

function loaderFor(path: string): "tsx" | "ts" | "jsx" | "js" | "json" | "text" {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "tsx") return "tsx";
  if (ext === "ts") return "ts";
  if (ext === "jsx") return "jsx";
  if (ext === "json") return "json";
  if (ext === "js" || ext === "mjs" || ext === "cjs") return "jsx";
  return "text";
}

function joinPath(importer: string, spec: string): string {
  const base = importer.split("/").slice(0, -1);
  const parts = spec.split("/");
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") base.pop();
    else base.push(part);
  }
  return base.join("/");
}

function findInVfs(vfs: Map<string, string>, candidate: string): string | null {
  for (const ext of JS_EXT) {
    const p = `${candidate}${ext}`;
    if (vfs.has(p)) return p;
  }
  for (const ext of JS_EXT.slice(1)) {
    const p = `${candidate}/index${ext}`;
    if (vfs.has(p)) return p;
  }
  return null;
}

function cssModule(css: string): string {
  return `const s=document.createElement("style");s.textContent=${JSON.stringify(
    css,
  )};document.head.appendChild(s);export default {};`;
}

function svgModule(svg: string): string {
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return `export default ${JSON.stringify(url)};`;
}

export interface BundleResult {
  code: string;
  warnings: string[];
  externals: string[];
}

export async function bundlePreview(
  files: CanvasFile[],
  entry: string,
  extra: CanvasFile[] = [],
): Promise<BundleResult> {
  const esbuild = await initBundler();
  const deps = readDependencies(files);
  const vfs = new Map<string, string>();
  for (const f of [...files, ...extra]) vfs.set(f.path.replace(/^\/+/, ""), f.content);
  const externals = new Set<string>();

  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: "esm",
    target: "es2020",
    platform: "browser",
    jsx: "automatic",
    jsxImportSource: "react",
    logLevel: "silent",
    define: {
      "process.env.NODE_ENV": '"development"',
      global: "globalThis",
      "import.meta.env.MODE": '"development"',
      "import.meta.env.DEV": "true",
      "import.meta.env.PROD": "false",
    },
    plugins: [
      {
        name: "canvas-vfs",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            const spec = args.path;
            if (/^(https?:)?\/\//.test(spec) || spec.startsWith("data:")) {
              return { path: spec, external: true };
            }
            if (args.kind === "entry-point") {
              const found = findInVfs(vfs, spec.replace(/^\/+/, ""));
              if (!found) return { errors: [{ text: `Entry point sa nenašiel: ${spec}` }] };
              return { path: found, namespace: "vfs" };
            }
            const importer = args.importer.replace(/^\/+/, "");
            let candidate: string | null = null;
            if (spec.startsWith(".")) candidate = findInVfs(vfs, joinPath(importer, spec));
            else if (spec.startsWith("@/")) candidate = findInVfs(vfs, `src/${spec.slice(2)}`);
            else if (spec.startsWith("~/")) candidate = findInVfs(vfs, `src/${spec.slice(2)}`);
            else if (spec.startsWith("/")) candidate = findInVfs(vfs, spec.slice(1));
            else candidate = findInVfs(vfs, spec) ?? findInVfs(vfs, `src/${spec}`);

            if (candidate) return { path: candidate, namespace: "vfs" };
            if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("@/")) {
              return {
                errors: [{ text: `Súbor sa nenašiel: ${spec} (import v ${importer || "entry"})` }],
              };
            }
            externals.add(spec);
            return { path: esmUrl(spec, deps), external: true };
          });

          build.onLoad({ filter: /.*/, namespace: "vfs" }, (args) => {
            const contents = vfs.get(args.path) ?? "";
            if (args.path.endsWith(".css")) return { contents: cssModule(contents), loader: "js" };
            if (args.path.endsWith(".svg")) return { contents: svgModule(contents), loader: "js" };
            return { contents, loader: loaderFor(args.path) };
          });
        },
      },
    ],
  });

  const code = result.outputFiles?.[0]?.text ?? "";
  return {
    code,
    warnings: result.warnings.map(formatMessage),
    externals: [...externals],
  };
}

interface EsbuildLikeMessage {
  text: string;
  location?: { file?: string; line?: number; column?: number } | null;
}

export function formatMessage(m: EsbuildLikeMessage): string {
  const loc = m.location;
  return loc?.file ? `${loc.file}:${loc.line ?? 0}:${loc.column ?? 0} — ${m.text}` : m.text;
}

/** Zrozumiteľné chyby buildu (esbuild hádže objekt s poľom errors). */
export function extractBuildErrors(error: unknown): string[] {
  const maybe = error as { errors?: EsbuildLikeMessage[]; message?: string };
  if (Array.isArray(maybe?.errors) && maybe.errors.length > 0) {
    return maybe.errors.map(formatMessage);
  }
  return [maybe?.message ?? String(error)];
}
