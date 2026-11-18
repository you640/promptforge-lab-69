import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LayoutDashboard, ScanSearch, ListChecks, Library, FlaskConical, Boxes, History, Settings, GraduationCap, Menu, X, WifiOff, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, module: "OVERVIEW" },
  { to: "/analyzator", label: "Analyzátor", icon: ScanSearch, module: "ANALYZER" },
  { to: "/kriteria", label: "Detail kritérií", icon: ListChecks, module: "CRITERIA" },
  { to: "/sablony", label: "Návrhy a šablóny", icon: Library, module: "LIBRARY" },
  { to: "/sandbox", label: "Testovací sandbox", icon: FlaskConical, module: "SANDBOX" },
  { to: "/canvas", label: "Canvas (ZIP projekt)", icon: Boxes, module: "CANVAS" },
  { to: "/historia", label: "História & reporty", icon: History, module: "HISTORY" },
  { to: "/nastavenia", label: "Nastavenia & tím", icon: Settings, module: "SETTINGS" },
  { to: "/pomoc", label: "Pomoc a vzdelávanie", icon: GraduationCap, module: "HELP" },
] as const;

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const module = NAV.find((item) => item.to === pathname)?.module ?? "WORKSPACE";
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const items = drawer.current?.querySelectorAll<HTMLElement>('a, button, [tabindex="0"]');
      const first = items?.[0];
      const last = items?.[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", keydown); menuTrigger.current?.focus(); };
  }, [open]);
  return (
    <div className="flex min-h-screen w-full">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[60] rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only">Prejsť na obsah</a>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <Brand /><Nav pathname={pathname} /><SidebarFooter online={online} />
      </aside>
      {open && <div className="fixed inset-0 z-50 flex lg:hidden">
        <div className="absolute inset-0 bg-editor/80 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
        <aside ref={drawer} role="dialog" aria-modal="true" aria-label="Navigácia" className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <div className="flex items-center justify-between pr-3"><Brand /><Button size="icon" variant="ghost" aria-label="Zavrieť menu" onClick={() => setOpen(false)}><X /></Button></div>
          <Nav pathname={pathname} /><SidebarFooter online={online} />
        </aside>
      </div>}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
          <div className="flex min-h-20 items-center gap-3 px-4 py-3 lg:px-8">
            <Button ref={menuTrigger} size="icon" variant="outline" aria-label="Otvoriť menu" aria-expanded={open} onClick={() => setOpen(true)} className="shrink-0 lg:hidden"><Menu /></Button>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><span>WORKSPACE</span><ChevronRight className="h-3 w-3" /><span className="text-blueprint">{module}</span></div>
              <h1 className="text-lg font-bold sm:text-xl">{title}</h1>
              {subtitle && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
            </div>
            <span className="blueprint-badge hidden shrink-0 sm:inline-flex"><span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-success" : "bg-warning")} />{online ? "SYS: ONLINE" : "SYS: OFFLINE"}</span>
          </div>
          {!online && <div className="flex items-center gap-2 border-t border-warning/20 bg-warning/10 px-4 py-2 text-xs lg:px-8"><WifiOff className="h-3.5 w-3.5" />Offline režim — lokálna analýza je dostupná.</div>}
        </header>
        <main id="main-content" className={cn("workspace-content mx-auto w-full flex-1 px-4 py-6 lg:px-8 lg:py-8", pathname === "/canvas" ? "max-w-[1600px]" : "max-w-6xl")}>{children}</main>
        <footer className="mx-4 flex flex-wrap items-center justify-between gap-2 border-t border-border py-4 font-mono text-[10px] text-muted-foreground lg:mx-8"><span>Auditor Promptov · Blueprint edition</span><span>7 KRITÉRIÍ / LOKÁLNE AUDITY</span></footer>
      </div>
    </div>
  );
}
function Brand() {
  return <Link to="/" className="flex min-w-0 items-center gap-3 border-b border-sidebar-border px-5 py-6">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-blueprint"><ShieldCheck className="h-5 w-5" /></span>
    <span className="min-w-0"><span className="block font-display text-sm font-bold">Auditor Promptov</span><span className="mt-1 block font-mono text-[10px] text-sidebar-foreground/60">pre PWA <span className="text-blueprint">/ BLUEPRINT</span></span></span>
  </Link>;
}
function Nav({ pathname }: { pathname: string }) {
  return <nav aria-label="Hlavná navigácia" className="flex-1 overflow-y-auto px-3 py-5">
    <p className="mb-3 px-3 font-mono text-[10px] uppercase text-sidebar-foreground/40">Pracovný priestor</p>
    <div className="space-y-1">{NAV.map((item) => <Link key={item.to} to={item.to} aria-current={pathname === item.to ? "page" : undefined} className={cn("flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-[13px] transition-colors", pathname === item.to ? "border-primary bg-sidebar-primary/10 text-sidebar-accent-foreground" : "border-transparent text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}><item.icon className={cn("h-4 w-4 shrink-0", pathname === item.to && "text-blueprint")} /><span>{item.label}</span></Link>)}</div>
  </nav>;
}
function SidebarFooter({ online }: { online: boolean }) {
  return <div className="space-y-2 border-t border-sidebar-border px-5 py-5 font-mono text-[10px] text-sidebar-foreground/50"><div className="flex items-center gap-2"><span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-success" : "bg-warning")} />{online ? "ONLINE" : "OFFLINE"} · v1.0</div><div>LOCAL WORKSPACE</div></div>;
}
