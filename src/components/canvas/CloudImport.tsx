import { useEffect, useState } from "react";
import { CloudDownload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { importStoredProject } from "@/lib/canvas-store";
import type { CanvasFile } from "@/lib/canvas-types";

const PENDING = "apw.canvas.cloud-import";

/** Skopíruje projekty prihláseného účtu do prehliadača a potom ho odhlási. */
async function pullAndSignOut(): Promise<number> {
  const { data: projects, error } = await supabase
    .from("canvas_projects")
    .select("id, name, file_count, created_at, updated_at");
  if (error) throw new Error(error.message);
  let count = 0;
  for (const p of projects ?? []) {
    const [files, versions] = await Promise.all([
      supabase.from("canvas_files").select("path, content").eq("project_id", p.id),
      supabase
        .from("canvas_versions")
        .select("id, version, prompt, audit_score, created_at, files")
        .eq("project_id", p.id),
    ]);
    if (files.error) throw new Error(files.error.message);
    if (versions.error) throw new Error(versions.error.message);
    const ok = importStoredProject({
      project: p,
      files: files.data ?? [],
      versions: (versions.data ?? []).map((v) => ({
        ...v,
        files: (v.files as unknown as CanvasFile[]) ?? [],
      })),
    });
    if (ok) count++;
  }
  await supabase.auth.signOut();
  return count;
}

export function CloudImport({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    try {
      const n = await pullAndSignOut();
      localStorage.removeItem(PENDING);
      toast.success(n > 0 ? `Prenesené projekty: ${n}` : "Žiadne nové projekty na prenos");
      setOpen(false);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Prenos zlyhal");
    }
  };

  // Návrat z prihlásenia cez Google (presmerovanie) — dokonči prenos.
  useEffect(() => {
    if (localStorage.getItem(PENDING) !== "1") return;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void run();
      else localStorage.removeItem(PENDING);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withPassword = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error("Nesprávny e-mail alebo heslo");
    else await run();
    setBusy(false);
  };

  const withGoogle = async () => {
    setBusy(true);
    localStorage.setItem(PENDING, "1");
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/canvas",
    });
    if (res.error) {
      localStorage.removeItem(PENDING);
      toast.error("Prihlásenie cez Google zlyhalo");
    } else if (!res.redirected) await run();
    setBusy(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <CloudDownload className="mr-1 h-4 w-4" />
        Preniesť staré projekty
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preniesť staré projekty z cloudu</DialogTitle>
            <DialogDescription>
              Prihláste sa raz účtom, ktorý ste používali predtým. Projekty sa skopírujú do tohto
              prehliadača a hneď vás odhlásime.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={withGoogle} disabled={busy}>
              Pokračovať cez Google
            </Button>
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Heslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button className="w-full" onClick={withPassword} disabled={busy || !email || !password}>
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Preniesť projekty
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
