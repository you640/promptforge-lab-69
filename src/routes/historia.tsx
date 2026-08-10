import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportHistoryCsv, exportJson } from "@/lib/export";
import { clearHistory, deleteEntry, loadHistory, type HistoryEntry } from "@/lib/storage";

export const Route = createFileRoute("/historia")({
  head: () => ({
    meta: [
      { title: "História a reporty — Auditor Promptov pre PWA" },
      {
        name: "description",
        content:
          "Archív auditov promptov s exportom do CSV a JSON, sledovanie zlepšovania skóre v čase.",
      },
      { property: "og:title", content: "História auditov a reporty" },
      {
        property: "og:description",
        content: "Ukladaj audity, porovnávaj skóre a exportuj reporty pre tím.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  return (
    <AppShell title="História & reporty" subtitle="Všetky uložené audity a exporty">
      <div className="mb-5 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!entries.length}
          onClick={() => exportHistoryCsv(entries)}
        >
          <FileDown className="mr-1 h-4 w-4" /> Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!entries.length}
          onClick={() => exportJson(entries, `historia-auditov-${Date.now()}.json`)}
        >
          <FileDown className="mr-1 h-4 w-4" /> Export JSON
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!entries.length}
          onClick={() => {
            clearHistory();
            setEntries([]);
            toast.info("História vymazaná");
          }}
        >
          <Trash2 className="mr-1 h-4 w-4" /> Vymazať všetko
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <p className="font-semibold">Zatiaľ žiadne audity</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyzuj prompt a klikni na „Uložiť audit“ — objaví sa tu.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="surface-card p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString("sk-SK")}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.prompt}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge variant={e.total >= 75 ? "default" : "secondary"}>
                    {e.total}/100 · {e.grade}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deleteEntry(e.id);
                      setEntries(loadHistory());
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Zmazať audit</span>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
