import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FileText, Sparkles, TrendingUp, ScanSearch, Boxes, Library, Plus, Clock3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CriteriaBars, ScoreRing } from "@/components/ScoreVisuals";
import { Button } from "@/components/ui/button";
import { CRITERIA, analyzePrompt } from "@/lib/criteria";
import { DRAFT_KEY, loadHistory, type HistoryEntry } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dashboard — Auditor Promptov pre PWA" },
    { name: "description", content: "Pracovný priestor pre audit PWA promptov, sedem kritérií kvality a bezpečné skúšanie zmien v Canvase." },
    { property: "og:title", content: "Dashboard — Auditor Promptov pre PWA" },
    { property: "og:description", content: "Tvoje audity, skóre a projekty v jednom prehľadnom blueprint pracovnom priestore." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Dashboard,
});
const DEMO_PROMPT = "Vytvor PWA aplikáciu na sledovanie výdavkov. Používatelia si zapisujú transakcie, vidia grafy a export.";
function Dashboard() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  useEffect(() => { setHistory(loadHistory()); }, []);
  const latest = history[0];
  const result = useMemo(() => analyzePrompt(latest?.prompt ?? DEMO_PROMPT), [latest?.prompt]);
  const avg = history.length ? Math.round(history.reduce((a, e) => a + e.total, 0) / history.length) : 0;
  return <AppShell title="Dashboard" subtitle="Tvoj pracovný priestor pre lepšie PWA prompty">
    <section className="blueprint-corner mb-7 border-b border-border pb-7">
      <div className="mb-4 flex items-center justify-between gap-3"><span className="blueprint-badge"><Plus className="h-3 w-3" />PROMPTFORGE / COMMAND CENTER</span><span className="hidden font-mono text-[10px] text-muted-foreground sm:block">PWA_CRITERIA: 7/7</span></div>
      <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Auditor Promptov <span className="text-blueprint">pre PWA</span></h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Od nápadu k presnému zadaniu. Skontroluj prompt alebo vyskúšaj zmeny na kópii svojho projektu.</p>
      <div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link to="/analyzator"><ScanSearch />Nový audit<ArrowRight /></Link></Button><Button asChild variant="outline"><Link to="/canvas"><Boxes />Otvoriť Canvas</Link></Button></div>
    </section>
    <div className="mb-7 grid gap-3 sm:grid-cols-3"><Stat icon={FileText} label="Uložené audity" value={String(history.length).padStart(2, "0")} /><Stat icon={TrendingUp} label="Priemerné skóre" value={history.length ? `${avg}/100` : "—"} /><Stat icon={Sparkles} label="Kritériá kvality" value={String(CRITERIA.length).padStart(2, "0")} /></div>
    <section className="mb-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">{latest ? "Posledný audit" : "Ukážkový audit"}</h2><Button asChild size="sm" variant="ghost"><Link to="/historia">História<ArrowRight /></Link></Button></div>
      <div className="blueprint-card grid gap-6 p-5 sm:p-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center gap-4 md:border-r md:border-border md:pr-6"><ScoreRing value={result.total} grade={result.grade} /><div className="text-center"><p className="max-w-52 break-words text-sm font-semibold">{latest?.title ?? "Sledovanie výdavkov"}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{latest ? new Date(latest.createdAt).toLocaleDateString("sk-SK") : "DEMO / BEZ ULOŽENIA"}</p></div></div>
        <div className="min-w-0"><p className="blueprint-badge mb-4">ROZPAD PODĽA KRITÉRIÍ</p><CriteriaBars result={result} /></div>
      </div>
    </section>
    <section className="mb-7"><h2 className="mb-4 text-base font-semibold">Pokračuj v práci</h2><div className="grid gap-3 sm:grid-cols-3">{[
      { to: "/analyzator", icon: ScanSearch, label: "Analyzátor", detail: "Prompt & skóre", accent: "text-blueprint" },
      { to: "/canvas", icon: Boxes, label: "Prompt Canvas", detail: "Projekt & živý náhľad", accent: "text-success" },
      { to: "/sablony", icon: Library, label: "Knižnica šablón", detail: "Pripravené zadania", accent: "text-technical" },
    ].map((item) => <Link key={item.to} to={item.to} className="blueprint-card group flex items-center gap-3 p-4 transition-colors hover:border-primary/40"><item.icon className={`h-5 w-5 shrink-0 ${item.accent}`} /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.label}</span><span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>)}</div></section>
    {latest ? <section className="border-t border-border pt-5"><div className="mb-3 flex items-center gap-2"><Clock3 className="h-4 w-4 text-muted-foreground" /><h2 className="text-base font-semibold">Nedávne audity</h2></div><ul className="divide-y divide-border">{history.slice(0, 3).map((entry) => <li key={entry.id} className="flex items-center justify-between gap-3 py-3"><span className="min-w-0"><span className="block truncate text-sm">{entry.title}</span><span className="font-mono text-[10px] text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString("sk-SK")}</span></span><span className="shrink-0 font-mono text-xs text-blueprint">{entry.total}/100</span><Button asChild size="icon" variant="ghost"><Link to="/analyzator" aria-label={`Otvoriť audit ${entry.title}`} onClick={() => localStorage.setItem(DRAFT_KEY, entry.prompt)}><ArrowRight /></Link></Button></li>)}</ul></section> : <section className="border-t border-border pt-5"><h2 className="mb-3 text-base font-semibold">Odporúčané ďalšie kroky</h2><ul className="space-y-3 text-sm text-muted-foreground">{result.suggestions.slice(0, 3).map((suggestion) => <li key={suggestion} className="flex gap-3"><Plus className="mt-0.5 h-4 w-4 shrink-0 text-blueprint" /><span>{suggestion}</span></li>)}</ul></section>}
  </AppShell>;
}
function Stat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return <div className="blueprint-card flex items-center justify-between gap-4 p-5"><div><span className="block text-xs text-muted-foreground">{label}</span><span className="mt-2 block font-mono text-2xl font-medium tabular-nums">{value}</span></div><Icon className="h-5 w-5 shrink-0 text-blueprint" /></div>;
}
