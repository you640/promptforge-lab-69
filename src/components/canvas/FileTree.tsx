import { FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasFile } from "@/lib/canvas-types";

export function FileTree({
  files,
  active,
  changed,
  selected,
  onSelect,
  onToggleContext,
}: {
  files: CanvasFile[];
  active: string | null;
  changed: string[];
  selected: string[];
  onSelect: (path: string) => void;
  onToggleContext: (path: string) => void;
}) {
  return (
    <ul className="max-h-[420px] space-y-0.5 overflow-y-auto pr-1 text-sm">
      {files.map((f) => (
        <li key={f.path} className="flex items-center gap-2">
          <input
            type="checkbox"
            aria-label={`Pridať ${f.path} do kontextu promptu`}
            checked={selected.includes(f.path)}
            onChange={() => onToggleContext(f.path)}
            className="h-3.5 w-3.5 shrink-0 accent-primary"
          />
          <button
            type="button"
            onClick={() => onSelect(f.path)}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
              active === f.path
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <FileCode2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-mono text-xs">{f.path}</span>
            {changed.includes(f.path) && (
              <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
            )}
          </button>
        </li>
      ))}
      {files.length === 0 && (
        <li className="px-2 py-6 text-center text-xs text-muted-foreground">Žiadne súbory</li>
      )}
    </ul>
  );
}
