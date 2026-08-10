import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { defaultSettings, loadSettings, saveSettings, type Settings } from "@/lib/storage";

export const Route = createFileRoute("/nastavenia")({
  head: () => ({
    meta: [
      { title: "Nastavenia a tím — Auditor Promptov pre PWA" },
      {
        name: "description",
        content:
          "Nastav minimálne akceptačné skóre, notifikácie, autora a tím pre audity PWA promptov.",
      },
      { property: "og:title", content: "Nastavenia a tímová spolupráca" },
      {
        property: "og:description",
        content: "Prispôsob si prahové skóre, notifikácie a tímové údaje.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [s, setS] = useState<Settings>(defaultSettings);

  useEffect(() => {
    setS(loadSettings());
  }, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  return (
    <AppShell title="Nastavenia & tím" subtitle="Preferencie auditu a tímové údaje">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="surface-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Users className="h-4 w-4 text-primary" /> Profil a tím
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="author">Meno autora</Label>
              <Input
                id="author"
                className="mt-1.5"
                value={s.authorName}
                onChange={(e) => update("authorName", e.target.value)}
                placeholder="Napr. Jana Nováková"
              />
            </div>
            <div>
              <Label htmlFor="team">Názov tímu</Label>
              <Input
                id="team"
                className="mt-1.5"
                value={s.teamName}
                onChange={(e) => update("teamName", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="surface-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Bell className="h-4 w-4 text-primary" /> Audit a notifikácie
          </h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="auto" className="font-normal">
                Automatická analýza počas písania
              </Label>
              <Switch
                id="auto"
                checked={s.autoAnalyze}
                onCheckedChange={(v) => update("autoAnalyze", v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notif" className="font-normal">
                Notifikácie o nízkom skóre
              </Label>
              <Switch
                id="notif"
                checked={s.notifications}
                onCheckedChange={async (v) => {
                  update("notifications", v);
                  if (v && "Notification" in window) await Notification.requestPermission();
                }}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <Label className="font-normal">Minimálne akceptačné skóre</Label>
                <span className="font-semibold tabular-nums">{s.minScore}</span>
              </div>
              <Slider
                value={[s.minScore]}
                min={40}
                max={95}
                step={5}
                onValueChange={(v) => update("minScore", v[0] ?? 75)}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5">
        <Button
          onClick={() => {
            saveSettings(s);
            toast.success("Nastavenia uložené");
          }}
        >
          <Save className="mr-1 h-4 w-4" /> Uložiť nastavenia
        </Button>
      </div>
    </AppShell>
  );
}
