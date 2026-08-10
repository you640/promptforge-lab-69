import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ScanSearch,
  ListChecks,
  Library,
  FlaskConical,
  History,
  Settings,
  GraduationCap,
  Menu,
  X,
  WifiOff,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analyzator", label: "Analyzátor", icon: ScanSearch },
  { to: "/kriteria", label: "Detail kritérií", icon: ListChecks },
  { to: "/sablony", label: "Návrhy a šablóny", icon: Library },
  { to: "/sandbox", label: "Testovací sandbox", icon: FlaskConical },
  { to: "/historia", label: "História & reporty", icon: History },
  { to: "/nastavenia", label: "Nastavenia & tím", icon: Settings },
  { to: "/pomoc", label: "Pomoc a vzdelávanie", icon: GraduationCap },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Brand />
        <Nav pathname={pathname} />
        <SidebarFooter online={online} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button
                aria-label="Zavrieť menu"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Nav pathname={pathname} />
            <SidebarFooter online={online} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-3 lg:px-8">
            <button
              aria-label="Otvoriť menu"
              onClick={() => setOpen(true)}
              className="rounded-md border border-border p-2 text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
              )}
            </div>
          </div>
          {!online && (
            <div className="flex items-center gap-2 bg-warning/20 px-4 py-1.5 text-xs text-foreground lg:px-8">
              <WifiOff className="h-3.5 w-3.5" /> Offline režim — analýza beží lokálne, dáta sú v
              zariadení.
            </div>
          )}
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3 px-5 py-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-hero text-primary-foreground">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-bold leading-tight">
          Auditor Promptov
        </span>
        <span className="block truncate text-xs text-sidebar-foreground/60">pre PWA</span>
      </span>
    </div>
  );
}

function Nav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ online }: { online: boolean }) {
  return (
    <div className="border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-foreground/60">
      <div className="flex items-center gap-2">
        <span
          className={cn("h-2 w-2 rounded-full", online ? "bg-success" : "bg-warning")}
          aria-hidden
        />
        {online ? "Online" : "Offline"} · v1.0
      </div>
    </div>
  );
}
