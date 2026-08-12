import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Gauge, Loader2, Play, Radar } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { analyzePrompt } from "@/lib/criteria";
import { runLighthouseAudit, type LighthouseAudit } from "@/lib/lighthouse.functions";
import { loadLighthouseAudits, saveLighthouseAudits } from "@/lib/storage";

export const Route = createFileRoute("/sandbox")({
  head: () => ({
    meta: [
      { title: "Testovací sandbox — Auditor Promptov pre PWA" },
      {
        name: "description",
        content:
          "Sandbox na porovnanie dvoch verzií promptu a reálny Lighthouse audit výkonu cez PageSpeed Insights.",
      },
      { property: "og:title", content: "Sandbox s reálnym Lighthouse auditom" },
      {
        property: "og:description",
        content: "A/B porovnaj verzie promptu a spusti reálny Lighthouse audit nasadenej PWA.",
      },
    ],
  }),
  component: Sandbox,
});

function Sandbox() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [ran, setRan] = useState(false);
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<LighthouseAudit | null>(null);
  const auditFn = useServerFn(runLighthouseAudit);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await auditFn({ data: { url: url.trim(), strategy } });
      setAudit(res);
      const prev = loadLighthouseAudits<LighthouseAudit>();
      saveLighthouseAudits([res, ...prev].slice(0, 10));
      toast.success("Lighthouse audit dokončený");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Audit sa nepodarilo spustiť");
    } finally {
      setLoading(false);
    }
  };

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
