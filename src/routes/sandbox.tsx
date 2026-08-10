import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Gauge, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { analyzePrompt } from "@/lib/criteria";

export const Route = createFileRoute("/sandbox")({
  head: () => ({
    meta: [
      { title: "Testovací sandbox — Auditor Promptov pre PWA" },
      {
        name: "description",
        content:
          "Offline sandbox na porovnanie dvoch verzií promptu a simulovaný Lighthouse odhad pripravenosti PWA.",
      },
      { property: "og:title", content: "Offline sandbox pre PWA prompty" },
      {
        property: "og:description",
        content: "A/B porovnaj verzie promptu a odhadni Lighthouse pripravenosť.",
      },
    ],
  }),
  component: Sandbox;
});

function Sandbox() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [ran, setRan] = useState(false);

  const ra = useMemo(() => analyzePrompt(a), [a]);
  const rb = useMemo(() => analyzePrompt(b), [b]);

  const lighthouse = (score: number) => ({
    performance: Math.min(100, Math.round(score * 0.9 + 8)),
    accessibility: Math.min(100, Math.round(score * 0.85 + 12)),
    bestPractices: Math.min(100, Math.round(score * 0.88 + 10)),
    seo: Math.min(100, Math.round(score * 0.92 + 6)),
    pwa: Math.min(100, Math.round(score * 0.95 + 4)),
  });

  const winner = ran ? (ra.total === rb.total ? null : ra.total > rb.total ? "A" : "B") : null;

  return (
    <AppShell title="Testovací sandbox" subtitle="A/B porovnanie promptov a odhad Lighthouse skóre">
      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            ["Verzia A", a, setA, ra] as const,
            ["Verzia B", b, setB, rb] as const,
          ]
        ).map(([label, value, setValue, res]) => (
          <div key={label} className="surface-card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-semibold">{label}</h3>
              {ran && <Badge variant={winner === label.slice(-1) ? "default" : "secondary"}>{res.total}/100</Badge>}
            </div>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Vlož ${label.toLowerCase()} promptu…`}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => setRan(true)} disabled={!a.trim() || !b.trim()}>
          <Play className="mr-1 h-4 w-4" /> Spustiť test
        </Button>
        <p className="text-xs text-muted-foreground">
          Beží úplne lokálne v prehliadači — funguje aj bez internetu.
        </p>
      </div>

      {ran && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(
            [
              ["Verzia A", ra] as const,
              ["Verzia B", rb] as const,
            ]
          ).map(([label, res]) => {
            const lh = lighthouse(res.total);
            return (
              <div key={label} className="surface-card p-5">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Gauge className="h-4 w-4 text-primary" /> {label} — odhad Lighthouse
                </h3>
                <ul className="space-y-2 text-sm">
                  {Object.entries(lh).map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between gap-3">
                      <span className="capitalize text-muted-foreground">{k}</span>
                      <span className="font-semibold tabular-nums">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <div className="surface-card p-5 md:col-span-2">
            <h3 className="mb-2 font-semibold">Výsledok</h3>
            <p className="text-sm text-muted-foreground">
              {winner
                ? `Silnejšia je verzia ${winner} s rozdielom ${Math.abs(ra.total - rb.total)} bodov.`
                : "Obe verzie majú rovnaké skóre — rozhodni podľa detailu kritérií."}
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
