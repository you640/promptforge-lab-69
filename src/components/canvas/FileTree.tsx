import { FileCode2, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [search, setSearch] = useState("");
  const visible = files.filter((file) => file.path.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
    <div className="relative mb-3"><Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input aria-label="Vyhľadať súbor" placeholder="Vyhľadať súbor…" value={search} onChange={(event) => setSearch(event.target.value)} className="h-8 pl-8 text-xs" /></div>
    <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1 text-sm lg:max-h-[620px]">
      {visible.map((f) => (
        <li key={f.path} className="flex items-center gap-2">
          <input
            type="checkbox"
            aria-label={`Pridať ${f.path} do kontextu promptu`}
            checked={selected.includes(f.path)}
            onChange={() => onToggleContext(f.path)}
            className="h-3.5 w-3.5 shrink-0 accent-primary"
          />
          <Button
            variant="ghost"
            type="button"
            onClick={() => onSelect(f.path)}
            className={cn(
              "flex h-8 min-w-0 flex-1 justify-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
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
          </Button>
        </li>
      ))}
      {visible.length === 0 && (
        <li className="px-2 py-6 text-center text-xs text-muted-foreground">Žiadne súbory</li>
      )}
    </ul>
    </div>
  );
}
