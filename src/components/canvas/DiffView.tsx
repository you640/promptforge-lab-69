import { diffLines } from "@/lib/diff";
import { cn } from "@/lib/utils";

export function DiffView({ before, after }: { before: string; after: string }) {
  const lines = diffLines(before, after);
  return (
    <pre className="max-h-[320px] overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed">
      {lines.map((line, i) => (
        <div
          key={`${i}-${line.text}`}
          className={cn(
            "whitespace-pre-wrap px-1 font-mono",
            line.type === "add" && "bg-success/15 text-success",
            line.type === "remove" && "bg-destructive/15 text-destructive line-through",
            line.type === "same" && "text-muted-foreground",
          )}
        >
          {line.type === "add" ? "+ " : line.type === "remove" ? "- " : "  "}
          {line.text}
        </div>
      ))}
    </pre>
  );
}
