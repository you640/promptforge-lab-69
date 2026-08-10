import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FileText, Sparkles, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CriteriaBars, ScoreRing } from "@/components/ScoreVisuals";
import { Button } from "@/components/ui/button";
import { CRITERIA, analyzePrompt } from "@/lib/criteria";
import { loadHistory, type HistoryEntry } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Auditor Promptov pre PWA" },
      {
        name: "description",
        content:
          "Prehľad kvality tvojich PWA promptov: skóre podľa 7 kritérií, trend zlepšovania a rýchly vstup do analyzátora.",
      },
      { property: "og:title", content: "Dashboard — Auditor Promptov pre PWA" },
      {
        property: "og:description",
        content: "Analyzuj a vylepšuj prompty pre PWA aplikácie podľa 7 odborných kritérií.",
      },
    ],
  }),
  component: Dashboard,
});

const DEMO_PROMPT =
  "Vytvor PWA aplikáciu na sledovanie výdavkov. Používatelia si zapisujú transakcie, vidia grafy a export.";

function Dashboard() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const latest = history[0];
  const result = useMemo(() => analyzePrompt(latest?.prompt ?? DEMO_PROMPT), [latest?.prompt]);
  const avg = history.length
    ? Math.round(history.reduce((a, e) => a + e.total, 0) / history.length)
    : 0;

  return (
    <AppShell title="Dashboard" subtitle="Prehľad kvality promptov pre PWA projekty">
      <section className="surface-card gradient-hero mb-6 overflow-hidden p-6 text-primary-foreground sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
          Prompt quality audit
        </p>
        <h2 className="mt-2 max-w-2xl text-2xl font-bold sm:text-3xl">
          Zisti, či tvoj prompt naozaj dokáže vytvoriť použiteľnú PWA
        </h2>
        <p className="mt-3 max-w-2xl text-sm opacity-90">
          Sedem kritérií, okamžité bodovanie, konkrétne návrhy a vylepšená verzia promptu. Všetko
          funguje aj offline.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to="/analyzator">
              Spustiť analýzu <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link to="/sablony">Knižnica šablón</Link>
          </Button>
        </div>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={FileText} label="Uložené audity" value={String(history.length)} />
        <Stat icon={TrendingUp} label="Priemerné skóre" value={history.length ? `${avg}` : "—"} />
        <Stat icon={Sparkles} label="Kritérií v audite" value={String(CRITERIA.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="surface-card flex flex-col items-center gap-4 p-6">
          <ScoreRing value={result.total} grade={result.grade} />
          <div className="text-center">
            <p className="text-sm font-semibold">{latest ? latest.title : "Ukážkový prompt"}</p>
            <p className="text-xs text-muted-foreground">
              {latest
                ? new Date(latest.createdAt).toLocaleString("sk-SK")
                : "Zatiaľ bez uložených auditov"}
            </p>
          </div>
        </div>
        <div className="surface-card p-6">
          <h3 className="mb-4 text-base font-semibold">Rozpad podľa kritérií</h3>
          <CriteriaBars result={result} />
        </div>
      </div>

      <div className="surface-card mt-6 p-6">
        <h3 className="mb-3 text-base font-semibold">Odporúčané ďalšie kroky</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {result.suggestions.map((s) => (
            <li key={s} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card flex items-center gap-4 p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-xl font-bold">{value}</span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}
