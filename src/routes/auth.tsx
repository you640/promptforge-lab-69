import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Prihlásenie — Auditor Promptov pre PWA" },
      {
        name: "description",
        content:
          "Prihlás sa a pracuj s Canvasom: nahraj ZIP projektu, skúšaj prompty a ukladaj verzie do cloudu.",
      },
      { property: "og:title", content: "Prihlásenie do Auditora Promptov" },
      {
        property: "og:description",
        content: "Účet ti sprístupní Canvas s nahrávaním ZIP projektov a ukladaním verzií.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/canvas" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/canvas` },
        });
        if (error) throw error;
        toast.success("Účet vytvorený — môžeš pokračovať do Canvasu.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) void navigate({ to: "/canvas" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Prihlásenie sa nepodarilo");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Prihlásenie cez Google sa nepodarilo");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/canvas" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="surface-card w-full max-w-md p-7">
        <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl gradient-hero text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <h1 className="font-display text-2xl font-bold">
          {mode === "login" ? "Prihlásenie" : "Vytvorenie účtu"}
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Canvas ukladá tvoje projekty a verzie do cloudu, aby si sa k nim dostal z každého
          zariadenia.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {mode === "login" ? "Prihlásiť sa" : "Zaregistrovať sa"}
          </Button>
        </form>

        <Button variant="outline" className="mt-3 w-full" onClick={google} type="button">
          Pokračovať cez Google
        </Button>

        <button
          type="button"
          className="mt-5 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Nemáš účet? Zaregistruj sa" : "Už máš účet? Prihlás sa"}
        </button>
      </div>
    </div>
  );
}
