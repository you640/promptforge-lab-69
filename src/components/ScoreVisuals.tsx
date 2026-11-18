import { CRITERIA, scoreColor, type AnalysisResult } from "@/lib/criteria";
import { cn } from "@/lib/utils";

export function ScoreRing({ value, grade }: { value: number; grade?: string }) {
  const angle = Math.round((value / 100) * 360);
  return (
    <div
      className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full p-1.5"
      style={{
        background: `conic-gradient(var(--color-primary) ${angle}deg, var(--color-secondary) ${angle}deg)`,
      }}
      role="img"
      aria-label={`Celkové skóre ${value} zo 100`}
    >
      <div className="grid h-full w-full place-items-center rounded-full border border-border bg-card text-center">
        <div>
          <div className="font-mono text-4xl font-medium leading-none tabular-nums">{value}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {grade ? `známka ${grade}` : "zo 100"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CriteriaBars({ result }: { result: AnalysisResult }) {
  return (
    <ul className="space-y-3">
      {result.scores.map((s) => {
        const c = CRITERIA.find((x) => x.id === s.id);
        if (!c) return null;
        return (
          <li key={s.id}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium">{c.name}</span>
              <span className={cn("shrink-0 font-mono text-xs tabular-nums", scoreColor(s.score))}>
                {s.score}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-sm bg-secondary">
              <div
                className={cn(
                  "h-full rounded-sm transition-all duration-500",
                  s.score >= 80 ? "bg-success" : s.score >= 50 ? "bg-warning" : "bg-destructive",
                )}
                style={{ width: `${Math.max(2, s.score)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
