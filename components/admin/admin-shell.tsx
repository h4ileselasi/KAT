"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Radio, Megaphone, CalendarDays, ShoppingBag, Sparkles,
  Settings, Search, LogOut, ExternalLink, Image as ImageIcon, HandCoins,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { fetchLive } from "@/lib/data";

const NAV = [
  { section: "Overview", items: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Radio, label: "Live stream", href: "/admin/live" },
    { icon: HandCoins, label: "Giving", href: "/admin/donations" },
  ]},
  { section: "Content", items: [
    { icon: Megaphone, label: "Announcements", href: "/admin/announcements" },
    { icon: CalendarDays, label: "Events", href: "/admin/events" },
    { icon: ShoppingBag, label: "Store", href: "/admin/products" },
    { icon: Sparkles, label: "Prayer wall", href: "/admin/prayers" },
    { icon: ImageIcon, label: "Gallery", href: "/admin/gallery" },
  ]},
];

export function AdminShell({ children, title = "Dashboard" }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 bg-background lg:grid-cols-[236px_1fr]">
      {/* SIDEBAR */}
      <aside className="hidden flex-col border-r border-border bg-card px-3 py-4 lg:flex">
        <div className="flex items-center gap-2.5 px-2 pb-4">
          <Image src="/brand/logo.png" alt="" width={34} height={34} className="h-[34px] w-[34px] object-contain" />
          <div className="leading-tight"><p className="text-sm font-semibold">St. Catherine</p><p className="text-[10.5px] text-muted-foreground">Admin workspace</p></div>
        </div>
        {NAV.map((grp) => (
          <div key={grp.section}>
            <p className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{grp.section}</p>
            <nav className="flex flex-col">
              {grp.items.map((n) => {
                const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href}
                    className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-[13.5px] font-medium transition-colors ${active ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                    <n.icon className="h-[17px] w-[17px]" strokeWidth={2} />{n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
        <div className="mt-auto flex items-center gap-2.5 border-t border-border px-2 pt-3">
          <span className="grid h-8 w-8 place-items-center rounded-[3px] bg-emerald-500 text-[12px] font-bold text-emerald-950">EO</span>
          <div className="text-[12.5px]"><p className="font-semibold leading-tight">Fr. Emmanuel</p><p className="text-[10.5px] text-muted-foreground">Administrator</p></div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-w-0 flex-col">
        <header className="glass-strong sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border px-5">
          <span className="text-[13px] text-muted-foreground">Workspace / <b className="font-semibold text-foreground">{title}</b></span>
          <div className="ml-auto hidden items-center gap-2 border border-border bg-background px-3 py-1.5 text-[13px] text-muted-foreground sm:flex">
            <Search className="h-3.5 w-3.5" /> Search…<kbd className="ml-6 border border-border bg-secondary px-1.5 font-mono text-[11px]">⌘K</kbd>
          </div>
          <LiveStatusChip />
          <ThemeToggle />
          <button onClick={logout} aria-label="Sign out" className="grid h-9 w-9 place-items-center border border-border hover:bg-secondary"><LogOut className="h-4 w-4" /></button>
        </header>

        {/* mobile nav strip */}
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
          {NAV.flatMap((g) => g.items).map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`flex-none whitespace-nowrap px-3 py-1.5 text-[12.5px] font-medium ${active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>{n.label}</Link>
            );
          })}
        </div>

        <main className="min-w-0 flex-1 p-5 lg:p-7">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function LiveStatusChip() {
  const { data: live } = useQuery({ queryKey: ["live"], queryFn: fetchLive, refetchInterval: 15000 });
  const on = !!live?.is_live;
  return on ? (
    <Link href="/admin/live" className="flex items-center gap-2 border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-600 dark:text-red-300">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />Live now
    </Link>
  ) : (
    <Link href="/admin/live" className="flex items-center gap-2 border border-border px-3 py-1.5 text-[12px] font-semibold text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />Offline
    </Link>
  );
}

export function ViewSiteLink() {
  return (
    <Link href="/" target="_blank" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
      View site <ExternalLink className="h-3.5 w-3.5" />
    </Link>
  );
}
