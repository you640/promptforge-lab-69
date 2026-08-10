import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pomoc")({
  head: () => ({
    meta: [
      { title: "Pomoc a vzdelávanie — Auditor Promptov pre PWA" },
      {
        name: "description",
        content:
          "Príručka pre používateľov: ako písať prompty pre PWA, ako čítať skóre auditu a ako inštalovať aplikáciu na domovskú obrazovku.",
      },
      { property: "og:title", content: "Príručka: ako písať lepšie PWA prompty" },
      {
        property: "og:description",
        content: "Krok za krokom od prvého promptu po audit so skóre nad 90.",
      },
    ],
  }),
  component: HelpPage,
});

const STEPS = [
  {
    q: "Ako začať prvý audit?",
    a: "Otvor Analyzátor, vlož svoj prompt a skóre sa počíta okamžite počas písania. Potom klikni na „Vylepšiť“ a porovnaj verzie v diff viewere.",
  },
  {
    q: "Ako čítať skóre?",
    a: "0–39 (F) znamená veľmi nejasný prompt, 40–59 (D) základný, 60–74 (C) použiteľný, 75–89 (B) dobrý a 90+ (A) produkčne pripravený prompt.",
  },
  {
    q: "Ako nainštalovať aplikáciu na domovskú obrazovku?",
    a: "V Chrome/Edge použi ikonu inštalácie v adresnom riadku, na iOS Safari zvoľ Zdieľať → Pridať na plochu. Aplikácia sa potom otvára ako samostatná appka.",
  },
  {
    q: "Fungujú dáta offline?",
    a: "Áno. Analýza, šablóny aj história bežia lokálne v prehliadači, žiadny prompt neopúšťa tvoje zariadenie.",
  },
  {
    q: "Ako exportovať report pre klienta?",
    a: "V Analyzátore klikni na „Export PDF reportu“, alebo v Histórii vyexportuj celý archív do CSV/JSON.",
  },
];

function HelpPage() {
  return (
    <AppShell title="Pomoc a vzdelávanie" subtitle="Príručka, tipy a najčastejšie otázky">
      <section className="surface-card mb-6 p-6">
        <h2 className="text-lg font-semibold">Rýchly štart v troch krokoch</h2>
        <ol className="mt-4 space-y-3 text-sm">
          {[
            "Vyber šablónu v sekcii Návrhy a šablóny a načítaj ju do analyzátora.",
            "Doplň vlastný kontext — cieľovú skupinu, sekcie a akceptačné kritériá.",
            "Použi „Vylepšiť“, ulož audit a exportuj PDF report pre tím.",
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/analyzator">Otvoriť analyzátor</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/kriteria">Prečítať kritériá</Link>
          </Button>
        </div>
      </section>

      <h2 className="mb-3 text-lg font-semibold">Časté otázky</h2>
      <Accordion type="single" collapsible className="space-y-3">
        {STEPS.map((s) => (
          <AccordionItem key={s.q} value={s.q} className="surface-card border-b px-5">
            <AccordionTrigger className="text-left">{s.q}</AccordionTrigger>
            <AccordionContent className="pb-5 text-sm text-muted-foreground">{s.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </AppShell>
  );
}
