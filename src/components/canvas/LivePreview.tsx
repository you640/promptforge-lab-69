import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Monitor, RefreshCw, Smartphone, Tablet, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CanvasFile } from "@/lib/canvas-types";
import { bundlePreview, extractBuildErrors, initBundler } from "@/lib/preview/bundler";
import {
  COMPONENT_ENTRY,
  componentEntryFile,
  planPreview,
  type PreviewMode,
} from "@/lib/preview/mode";
import {
  docsDocument,
  errorDocument,
  moduleDocument,
  staticDocument,
} from "@/lib/preview/html";
import { renderDocsPreview } from "@/lib/preview/docs-render";
import { PreviewConsole, type PreviewLogEntry } from "./PreviewConsole";
import { PreviewFrame } from "./PreviewFrame";

const DEVICES = {
  mobile: { label: "Mobil", width: 390, icon: Smartphone },
  tablet: { label: "Tablet", width: 768, icon: Tablet },
  desktop: { label: "Desktop", width: "100%" as const, icon: Monitor },
};
type DeviceKey = keyof typeof DEVICES;

const MODE_LABEL: Record<PreviewMode, string> = {
  react: "React aplikácia",
  html: "Statická stránka",
  component: "Komponent",
  docs: "Dokumenty",
  none: "Nespustiteľné",
};

interface Settings {
  mode?: PreviewMode;
  target?: string;
}

function settingsKey(projectId: string) {
  return `apw.canvas.preview.${projectId}`;
}

function loadSettings(projectId: string | null): Settings {
  if (!projectId || typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(settingsKey(projectId)) ?? "{}") as Settings;
  } catch {
    return {};
  }
}

function saveSettings(projectId: string | null, value: Settings) {
  if (!projectId || typeof localStorage === "undefined") return;
  localStorage.setItem(settingsKey(projectId), JSON.stringify(value));
}

/** Z hlásenia vytiahne cestu k súboru a riadok, aby sa dalo skočiť do editora. */
function locate(message: string, files: CanvasFile[]): { file?: string; line?: number } {
  const match = /([\w./@-]+\.(?:tsx|ts|jsx|js|css|html|json)):(\d+)/.exec(message);
  if (match) {
    const path = match[1]!.replace(/^\/+/, "");
    const file = files.find((f) => f.path === path || f.path.endsWith(`/${path}`));
    if (file) return { file: file.path, line: Number(match[2]) };
  }
  const bare = files.find((f) => message.includes(f.path));
  return bare ? { file: bare.path } : {};
}

export default function LivePreview({
  files,
  projectId,
  onOpenFile,
}: {
  files: CanvasFile[];
  projectId?: string | null;
  onOpenFile?: (path: string) => void;
}) {
  const plan = useMemo(() => planPreview(files), [files]);
  const stored = useMemo(() => loadSettings(projectId ?? null), [projectId]);

  const [mode, setMode] = useState<PreviewMode>(stored.mode ?? plan.mode);
  const [target, setTarget] = useState<string | undefined>(stored.target ?? plan.target);
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const [doc, setDoc] = useState<string>("");
  const [building, setBuilding] = useState(false);
  const [logs, setLogs] = useState<PreviewLogEntry[]>([]);
  const [nonce, setNonce] = useState(0);
  const [externals, setExternals] = useState<string[]>([]);
  const logId = useRef(0);

  // Keď sa projekt zmení, vezmi jeho uložený režim alebo znovu detekuj.
  useEffect(() => {
    const s = loadSettings(projectId ?? null);
    setMode(s.mode ?? plan.mode);
    setTarget(s.target ?? plan.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (mode === "react" && !files.some((f) => f.path === target)) setTarget(plan.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.mode, plan.target]);

  useEffect(() => {
    saveSettings(projectId ?? null, { ...(mode ? { mode } : {}), ...(target ? { target } : {}) });
  }, [projectId, mode, target]);

  // WASM bundler zahrejeme hneď, aby prvý build nečakal na inicializáciu.
  useEffect(() => {
    void initBundler().catch(() => undefined);
  }, []);

  const pushLog = useCallback((entry: Omit<PreviewLogEntry, "id">) => {
    logId.current += 1;
    const id = logId.current;
    setLogs((prev) => [...prev.slice(-199), { ...entry, id }]);
  }, []);

  // Konzola a chyby z iframe.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | { source?: string; level?: string; message?: string; stack?: string | null }
        | undefined;
      if (data?.source !== "canvas-preview") return;
      if (data.level === "status") return;
      const message = [data.message, data.stack].filter(Boolean).join("\n");
      const level = (["log", "info", "warn", "error"] as const).includes(
        data.level as "log",
      )
        ? (data.level as PreviewLogEntry["level"])
        : "log";
      pushLog({ level, message, ...locate(message, files) });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [files, pushLog]);

  // Auto-refresh: prebuild po 400 ms od poslednej úpravy súborov.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setBuilding(true);
        try {
          if (mode === "html") {
            const path = target ?? plan.target;
            if (!path) throw new Error("Nenašiel sa HTML súbor");
            if (!cancelled) setDoc(staticDocument(files, path));
            setExternals([]);
          } else if (mode === "react" || mode === "component") {
            const entryPath = target ?? plan.target;
            if (!entryPath) throw new Error("Nenašiel sa entry point");
            const extra = mode === "component" ? [componentEntryFile(entryPath)] : [];
            const entry = mode === "component" ? COMPONENT_ENTRY : entryPath;
            const result = await bundlePreview(files, entry, extra);
            if (cancelled) return;
            setExternals(result.externals);
            for (const w of result.warnings) {
              pushLog({ level: "warn", message: w, ...locate(w, files) });
            }
            setDoc(moduleDocument(result.code, files));
          } else if (mode === "docs") {
            setDoc(docsDocument(renderDocsPreview(files, target)));
            setExternals([]);
          } else {
            setDoc(
              docsDocument(
                `<p class="hint">${plan.notes.join(" ")} Vyber režim „Komponent" alebo „Dokumenty" a zobrazíme, čo sa dá.</p>`,
              ),
            );
          }
        } catch (error) {
          if (cancelled) return;
          const messages = extractBuildErrors(error);
          for (const m of messages) pushLog({ level: "error", message: m, ...locate(m, files) });
          setDoc(errorDocument(messages));
        } finally {
          if (!cancelled) setBuilding(false);
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, mode, target, nonce]);

  const availableModes: PreviewMode[] = useMemo(() => {
    const list: PreviewMode[] = [];
    if (files.some((f) => f.path.endsWith(".html"))) list.push("html");
    if (plan.mode === "react" || files.some((f) => /src\/(main|index)\.[jt]sx?$/.test(f.path)))
      list.push("react");
    if (plan.components.length > 0) list.push("component");
    list.push("docs");
    return list.length > 0 ? list : ["none"];
  }, [files, plan]);

  const targetOptions = useMemo(() => {
    if (mode === "component") return plan.components;
    if (mode === "html") return files.filter((f) => f.path.endsWith(".html")).map((f) => f.path);
    if (mode === "react")
      return files
        .filter((f) => /\.(tsx|jsx|ts|js)$/.test(f.path) && /main|index|App/i.test(f.path))
        .map((f) => f.path);
    if (mode === "docs")
      return files.filter((f) => /\.(md|json|css|svg|ya?ml|txt)$/i.test(f.path)).map((f) => f.path);
    return [];
  }, [files, mode, plan.components]);

  const openInWindow = () => {
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const errors = logs.filter((l) => l.level === "error").length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={mode}
          onChange={(e) => {
            const next = e.target.value as PreviewMode;
            setMode(next);
            setTarget(undefined);
            setLogs([]);
          }}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          aria-label="Režim náhľadu"
        >
          {availableModes.map((m) => (
            <option key={m} value={m}>
              {MODE_LABEL[m]}
            </option>
          ))}
        </select>

        {targetOptions.length > 0 && (
          <select
            value={target ?? ""}
            onChange={(e) => setTarget(e.target.value || undefined)}
            className="h-8 min-w-[180px] max-w-[280px] rounded-md border border-input bg-background px-2 font-mono text-xs"
            aria-label={mode === "component" ? "Komponent na spustenie" : "Súbor náhľadu"}
          >
            <option value="">— automaticky —</option>
            {targetOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1 rounded-md border border-input p-0.5">
          {(Object.keys(DEVICES) as DeviceKey[]).map((key) => {
            const Icon = DEVICES[key].icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                title={DEVICES[key].label}
                aria-pressed={device === key}
                className={`rounded px-2 py-1 ${
                  device === key ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <Button size="sm" variant="outline" onClick={() => setNonce((n) => n + 1)}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Znova
        </Button>
        <Button size="sm" variant="ghost" onClick={openInWindow} disabled={!doc}>
          <ExternalLink className="mr-1 h-3.5 w-3.5" /> Nové okno
        </Button>

        <Badge variant={building ? "secondary" : "outline"} className="gap-1.5" aria-live="polite">
          {building ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {building ? "Buduje sa…" : errors > 0 ? `${errors} chýb` : "Aktuálne"}
        </Badge>
      </div>

      {externals.length > 0 && (
        <p className="mb-2 text-xs text-muted-foreground">
          Závislosti z esm.sh: <span className="font-mono">{externals.slice(0, 8).join(", ")}</span>
          {externals.length > 8 ? ` +${externals.length - 8}` : ""}
        </p>
      )}

      <PreviewFrame
        document={doc || "<!doctype html><body></body>"}
        width={DEVICES[device].width}
        height={480}
      />

      <PreviewConsole
        logs={logs}
        onClear={() => setLogs([])}
        onJump={(file) => onOpenFile?.(file)}
      />
    </div>
  );
}
