import { cn } from "@/lib/utils";

export interface PreviewLogEntry {
  id: number;
  level: "log" | "info" | "warn" | "error";
  message: string;
  /** Cesta k súboru a riadok, ak sa dá z hlásenia vytiahnuť. */
  file?: string;
  line?: number;
}

const LEVEL_STYLE: Record<PreviewLogEntry["level"], string> = {
  log: "text-muted-foreground",
  info: "text-primary",
  warn: "text-amber-500",
  error: "text-destructive",
};

export function PreviewConsole({
  logs,
  onJump,
  onClear,
}: {
  logs: PreviewLogEntry[];
  onJump: (file: string, line?: number) => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold">
          Konzola náhľadu{" "}
          <span className="text-muted-foreground">
            ({logs.length}
            {logs.some((l) => l.level === "error") ? " · chyby" : ""})
          </span>
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Vyčistiť
        </button>
      </div>
      <ul className="max-h-40 overflow-y-auto p-2 font-mono text-[11px]" aria-live="polite">
        {logs.length === 0 && (
          <li className="px-1 py-2 text-muted-foreground">Žiadne výpisy ani chyby.</li>
        )}
        {logs.map((log) => (
          <li key={log.id} className={cn("px-1 py-0.5", LEVEL_STYLE[log.level])}>
            <span className="whitespace-pre-wrap break-words">{log.message}</span>
            {log.file && (
              <button
                type="button"
                onClick={() => onJump(log.file!, log.line)}
                className="ml-2 underline decoration-dotted hover:text-foreground"
              >
                {log.file}
                {log.line ? `:${log.line}` : ""}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
