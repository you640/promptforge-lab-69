import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CRITERIA } from "@/lib/criteria";

export const Route = createFileRoute("/kriteria")({
  head: () => ({
    meta: [
      { title: "Detail kritérií — Auditor Promptov pre PWA" },
      {
        name: "description",
        content:
          "Podrobný popis 7 kritérií hodnotenia PWA promptov: špecifikácia, technika, UX/UI, výkon, testovanie, nasadenie a kreativita.",
      },
      { property: "og:title", content: "7 kritérií kvalitného PWA promptu" },
      {
        property: "og:description",
        content: "Váhy, checklisty a odborné tipy pre každé kritérium auditu.",
      },
    ],
  }),
  component: CriteriaPage,
});

function CriteriaPage() {
  return (
    <AppShell title="Detail kritérií" subtitle="Ako sa počíta skóre a čo presne sledujeme">
      <div className="surface-card mb-6 p-5 text-sm text-muted-foreground">
        Celkové skóre je vážený priemer siedmich kritérií. Vyššiu váhu majú špecifikácia a technická
        presnosť, pretože najviac ovplyvňujú výsledok generovanej PWA.
      </div>

      <Accordion type="multiple" className="space-y-3">
        {CRITERIA.map((c) => (
          <AccordionItem
            key={c.id}
            value={c.id}
            className="surface-card overflow-hidden border-b px-5"
          >
            <AccordionTrigger className="gap-3 text-left">
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span className="truncate font-semibold">{c.name}</span>
                <Badge variant="secondary" className="shrink-0">
                  váha {c.weight.toFixed(2)}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              <p className="text-sm text-muted-foreground">{c.description}</p>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Checklist
                </h4>
                <ul className="space-y-1.5 text-sm">
                  {c.checklist.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        aria-hidden
                      />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-accent/15 p-3 text-sm">
                <span className="font-semibold">Tip: </span>
                {c.tip}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.keywords.slice(0, 10).map((k) => (
                  <Badge key={k} variant="outline" className="text-[11px]">
                    {k}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </AppShell>
  );
}
