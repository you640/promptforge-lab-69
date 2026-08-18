import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BrainCircuit, Download, Loader2, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CriteriaBars, ScoreRing } from "@/components/ScoreVisuals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CRITERIA, analyzePrompt, improvePrompt } from "@/lib/criteria";
import { diffLines } from "@/lib/diff";
import { exportAnalysisPdf } from "@/lib/export";
import { DRAFT_KEY, loadLighthouseAudits, saveEntry } from "@/lib/storage";
import type { LighthouseAudit } from "@/lib/lighthouse.functions";
import { reviewPromptWithAi, type AiPromptReview } from "@/lib/prompt-ai.functions";

export const Route = createFileRoute("/analyzator")({
  head: () => ({
    meta: [
      { title: "Analyzátor promptov — Auditor Promptov pre PWA" },
      {
        name: "description",
        content:
          "Vlož prompt, získaj skóre podľa 7 kritérií, checklisty, vylepšenú verziu a diff porovnanie.",
      },
      { property: "og:title", content: "Analyzátor promptov pre PWA" },
      {
        property: "og:description",
        content: "Okamžité bodovanie promptu, konkrétne návrhy a export reportu do PDF.",
      },
    ],
  }),
  component: Analyzer,
});

function Analyzer() {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [audits, setAudits] = useState<LighthouseAudit[]>([]);
  const [review, setReview] = useState<AiPromptReview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [tab, setTab] = useState("checklist");
  const runReview = useServerFn(reviewPromptWithAi);

  async function handleAiReview() {
    if (prompt.trim().length < 20) {
      toast.error("Prompt je príliš krátky na AI audit (min. 20 znakov)");
      return;
    }
    setReviewing(true);
    try {
      const res = await runReview({ data: { prompt } });
      setReview(res);
      setTab("ai");
      toast.success(`AI hodnotenie hotové — ${Math.round(res.total)}/100`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI audit sa nepodaril");
    } finally {
      setReviewing(false);
    }
  }

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) setPrompt(draft);
    setAudits(loadLighthouseAudits<LighthouseAudit>());
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, prompt);
  }, [prompt]);


  const result = useMemo(() => analyzePrompt(prompt), [prompt]);
  const improved = useMemo(
    () => (prompt.trim() ? improvePrompt(prompt, result) : ""),
    [prompt, result],
  );
  const diff = useMemo(
    () => (improved ? diffLines(prompt, improved) : []),
    [prompt, improved],
  );

  return (
    <AppShell title="Analyzátor" subtitle="Editor promptu s automatickým hodnotením v reálnom čase">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="surface-card p-5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Názov promptu (napr. Fitness tracker PWA)"
            className="mb-3"
          />
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Vlož alebo napíš svoj prompt pre PWA aplikáciu…"
            className="min-h-[280px] font-mono text-sm"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{result.words} slov</Badge>
            <Badge variant="secondary">{result.chars} znakov</Badge>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrompt("");
                  toast.info("Editor vyčistený");
                }}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Vyčistiť
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!prompt.trim()}
                onClick={() => {
                  setPrompt(improved);
                  toast.success("Prompt vylepšený návrhmi");
                }}
              >
                <Wand2 className="mr-1 h-4 w-4" /> Vylepšiť
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={reviewing || !prompt.trim()}
                onClick={() => void handleAiReview()}
              >
                {reviewing ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <BrainCircuit className="mr-1 h-4 w-4" />
                )}
                AI audit
              </Button>
              <Button
                size="sm"
                disabled={!prompt.trim()}
                onClick={() => {
                  saveEntry(title, prompt, result);
                  toast.success("Audit uložený do histórie");
                }}
              >
                <Save className="mr-1 h-4 w-4" /> Uložiť audit
              </Button>
            </div>
          </div>
        </div>

        <div className="surface-card flex flex-col items-center gap-4 p-5">
          <ScoreRing value={result.total} grade={result.grade} />
          <div className="w-full">
            <CriteriaBars result={result} />
          </div>
          <Button
            variant="outline"
            className="w-full"
            disabled={!prompt.trim()}
            onClick={() => exportAnalysisPdf(title, prompt, result)}
          >
            <Download className="mr-1 h-4 w-4" /> Export PDF reportu
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="checklist">Checklisty</TabsTrigger>
          <TabsTrigger value="ai">AI audit</TabsTrigger>
          <TabsTrigger value="suggestions">Návrhy</TabsTrigger>
          <TabsTrigger value="diff">Diff viewer</TabsTrigger>
          <TabsTrigger value="lighthouse">Lighthouse</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-4">
          <div className="surface-card p-5">
            {review ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge>{Math.round(review.total)}/100 podľa AI</Badge>
                  <p className="min-w-0 text-sm text-muted-foreground">{review.verdict}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {review.scores.map((s) => {
                    const c = CRITERIA.find((x) => x.id === s.id);
                    return (
                      <div key={s.id} className="rounded-lg border border-border p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-semibold">{c?.name ?? s.id}</h3>
                          <Badge variant={s.score >= 80 ? "default" : "secondary"}>
                            {Math.round(s.score)}/100
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{s.finding}</p>
                        <p className="mt-2 text-sm">
                          <span className="font-medium">Oprav: </span>
                          {s.fix}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {review.risks.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Riziká</h3>
                    <ul className="space-y-2 text-sm">
                      {review.risks.map((r) => (
                        <li key={r} className="flex gap-3">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Prepísaný prompt od AI</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void navigator.clipboard.writeText(review.rewritten);
                          toast.success("Skopírované");
                        }}
                      >
                        Kopírovať
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setPrompt(review.rewritten);
                          toast.success("Prompt nahradený AI verziou");
                        }}
                      >
                        Použiť v editore
                      </Button>
                    </div>
                  </div>
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                    {review.rewritten}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Klikni na <span className="font-medium">AI audit</span> — model prejde prompt podľa 7
                kritérií, vypíše konkrétne nálezy, riziká a vráti kompletne prepísaný prompt.
              </p>
            )}
          </div>
        </TabsContent>


        <TabsContent value="lighthouse" className="mt-4">
          <div className="surface-card p-5">
            {audits.length ? (
              <div className="space-y-5">
                {audits.map((a) => (
                  <div key={`${a.url}-${a.fetchedAt}`} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold">{a.finalUrl}</span>
                      <Badge variant="secondary">{a.strategy}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.fetchedAt).toLocaleString("sk-SK")}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <ul className="space-y-1">
                        {Object.entries(a.categories).map(([k, v]) => (
                          <li key={k} className="flex items-center justify-between gap-3">
                            <span className="capitalize text-muted-foreground">{k}</span>
                            <span className="font-semibold tabular-nums">{v ?? "—"}</span>
                          </li>
                        ))}
                      </ul>
                      <ul className="space-y-1">
                        {a.metrics.map((m) => (
                          <li key={m.id} className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-muted-foreground">{m.title}</span>
                            <span className="font-semibold tabular-nums">{m.display}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Zatiaľ žiadny reálny Lighthouse audit — spusti ho v sekcii Testovací sandbox a
                výsledky sa zobrazia tu.
              </p>
            )}
          </div>
        </TabsContent>


        <TabsContent value="checklist" className="mt-4 grid gap-4 md:grid-cols-2">
          {result.scores.map((s) => {
            const c = CRITERIA.find((x) => x.id === s.id)!;
            return (
              <div key={s.id} className="surface-card p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="min-w-0 truncate text-sm font-semibold">{c.name}</h3>
                  <Badge variant={s.score >= 80 ? "default" : "secondary"}>{s.score}/100</Badge>
                </div>
                <ul className="space-y-2 text-sm">
                  {c.checklist.map((item, i) => {
                    const done = i < s.matched.length && s.score >= 40;
                    return (
                      <li key={item} className="flex gap-2">
                        <span
                          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-sm border text-[10px] ${
                            done
                              ? "border-success bg-success text-success-foreground"
                              : "border-border text-transparent"
                          }`}
                          aria-hidden
                        >
                          ✓
                        </span>
                        <span className={done ? "text-muted-foreground" : ""}>{item}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <div className="surface-card p-5">
            {prompt.trim() ? (
              <ul className="space-y-3 text-sm">
                {result.suggestions.map((s) => (
                  <li key={s} className="flex gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Zadaj prompt a zobrazia sa konkrétne návrhy na zlepšenie.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="diff" className="mt-4">
          <div className="surface-card overflow-x-auto p-5">
            {diff.length ? (
              <pre className="min-w-full font-mono text-xs leading-relaxed">
                {diff.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.type === "add"
                        ? "bg-success/15 text-foreground"
                        : line.type === "remove"
                          ? "bg-destructive/10 text-muted-foreground line-through"
                          : ""
                    }
                  >
                    <span className="select-none text-muted-foreground">
                      {line.type === "add" ? "+ " : line.type === "remove" ? "- " : "  "}
                    </span>
                    {line.text || " "}
                  </div>
                ))}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Diff sa zobrazí po zadaní promptu — porovná originál s vylepšenou verziou.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
