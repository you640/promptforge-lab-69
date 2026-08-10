import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/templates";
import { DRAFT_KEY } from "@/lib/storage";

export const Route = createFileRoute("/sablony")({
  head: () => ({
    meta: [
      { title: "Návrhy a šablóny — Auditor Promptov pre PWA" },
      {
        name: "description",
        content:
          "Knižnica pripravených promptov a CI/CD šablón pre PWA projekty: offline-first, autentifikácia, výkon, dizajn systém.",
      },
      { property: "og:title", content: "Knižnica PWA prompt šablón" },
      {
        property: "og:description",
        content: "Overené šablóny promptov, ktoré prechádzajú auditom so vysokým skóre.",
      },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const categories = ["Všetko", ...new Set(TEMPLATES.map((t) => t.category))];
  const [active, setActive] = useState("Všetko");
  const visible = TEMPLATES.filter((t) => active === "Všetko" || t.category === active);

  return (
    <AppShell title="Návrhy a šablóny" subtitle="Odpichni sa od promptov, ktoré fungujú">
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={active === c ? "default" : "outline"}
            onClick={() => setActive(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((t) => (
          <article key={t.id} className="surface-card flex flex-col p-5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="min-w-0 text-base font-semibold">{t.name}</h3>
              <Badge variant="secondary" className="shrink-0">
                {t.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t.description}</p>
            <pre className="mt-3 max-h-44 flex-1 overflow-auto rounded-lg bg-secondary p-3 font-mono text-[11px] leading-relaxed">
              {t.body}
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(t.body);
                  toast.success("Šablóna skopírovaná");
                }}
              >
                <Copy className="mr-1 h-4 w-4" /> Kopírovať
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  localStorage.setItem(DRAFT_KEY, t.body);
                  toast.success("Šablóna načítaná do analyzátora");
                }}
              >
                <Wand2 className="mr-1 h-4 w-4" /> Použiť v analyzátore
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
