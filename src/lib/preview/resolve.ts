import type { CanvasFile } from "@/lib/canvas-types";

/** Mapa npm závislostí projektu (name -> version) z package.json. */
export function readDependencies(files: CanvasFile[]): Record<string, string> {
  const pkg = files.find((f) => f.path === "package.json");
  if (!pkg) return {};
  try {
    const parsed = JSON.parse(pkg.content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return { ...(parsed.devDependencies ?? {}), ...(parsed.dependencies ?? {}) };
  } catch {
    return {};
  }
}

function cleanVersion(range: string | undefined): string | null {
  if (!range) return null;
  const match = /(\d+\.\d+\.\d+(?:-[\w.]+)?|\d+\.\d+|\d+)/.exec(range);
  return match ? match[1]! : null;
}

/** Rozdelí `@scope/pkg/sub/path` na názov balíka a podcestu. */
export function splitSpecifier(spec: string): { name: string; sub: string } {
  const parts = spec.split("/");
  if (spec.startsWith("@")) {
    return { name: parts.slice(0, 2).join("/"), sub: parts.slice(2).join("/") };
  }
  return { name: parts[0]!, sub: parts.slice(1).join("/") };
}

/**
 * Preloží bare import na URL na esm.sh. Verziu berieme z package.json,
 * inak necháme esm.sh vybrať najnovšiu.
 */
export function esmUrl(spec: string, deps: Record<string, string>): string {
  const { name, sub } = splitSpecifier(spec);
  const version = cleanVersion(deps[name]);
  const reactVersion = cleanVersion(deps["react"]);
  const base = `https://esm.sh/${name}${version ? `@${version}` : ""}${sub ? `/${sub}` : ""}`;
  // Zabráni dvom kópiám Reactu, keď balík tahá vlastnú verziu.
  if (reactVersion && name !== "react") return `${base}?deps=react@${reactVersion}`;
  return base;
}
