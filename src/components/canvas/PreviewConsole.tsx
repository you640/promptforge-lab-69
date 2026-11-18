import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, Terminal } from "lucide-react";

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
  warn: "text-warning",
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
    <div className="mt-3 overflow-hidden rounded-lg border border-border bg-editor">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="flex items-center gap-2 font-mono text-[11px] font-medium">
          <Terminal className="h-3.5 w-3.5 text-blueprint" />
          Konzola náhľadu{" "}
          <span className="text-muted-foreground">
            ({logs.length}
            {logs.some((l) => l.level === "error") ? " · chyby" : ""})
          </span>
        </span>
        <Button
          size="icon"
          variant="ghost"
          title="Vyčistiť konzolu"
          aria-label="Vyčistiť konzolu"
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Trash2 />
        </Button>
      </div>
      <ul className="max-h-40 overflow-y-auto p-2 font-mono text-[11px]" aria-live="polite">
        {logs.length === 0 && (
          <li className="px-1 py-2 text-muted-foreground">Žiadne výpisy ani chyby.</li>
        )}
        {logs.map((log) => (
          <li key={log.id} className={cn("px-1 py-0.5", LEVEL_STYLE[log.level])}>
            <span className="whitespace-pre-wrap break-words">{log.message}</span>
            {log.file && (
              <Button
                size="sm"
                variant="link"
                type="button"
                onClick={() => { if (log.file) onJump(log.file, log.line); }}
                className="ml-2 underline decoration-dotted hover:text-foreground"
              >
                {log.file}
                {log.line ? `:${log.line}` : ""}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
