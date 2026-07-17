"use client";

import { createContext, useContext, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu, X, Home, Radio, Sparkles, Store, CalendarDays, Settings, Bell,
  ChevronLeft, RotateCw, Gift, Image as ImageIcon, BookOpen, LogIn, LogOut, HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LiveChat } from "@/components/site/live-chat";
import { useAuth, displayName } from "@/components/auth/auth-provider";
import { useLiveConfig, useLiveViewers } from "@/lib/use-live";
import { type LiveConfig } from "@/lib/data";

const LOGO = "/brand/logo.png";
const INTERIOR = "/brand/interior.jpg";

/* Context so feed components (live card, story ring, dock) can open the watch view */
type SiteCtx = { live?: LiveConfig | null; openWatch: () => void };
const Ctx = createContext<SiteCtx>({ openWatch: () => {} });
export const useSite = () => useContext(Ctx);

const NAV = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Radio, label: "Watch Live", href: "/live" },
  { icon: Sparkles, label: "Prayer Wall", href: "/prayer" },
  { icon: CalendarDays, label: "Events", href: "/events" },
  { icon: Store, label: "Store", href: "/store" },
];

export function SiteShell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const { data: live } = useLiveConfig();

  return (
    <Ctx.Provider value={{ live, openWatch: () => setWatchOpen(true) }}>
      <div className="app-wash min-h-[100dvh]">
        <div className={`mx-auto grid max-w-[1500px] grid-cols-1 ${right ? "lg:grid-cols-[262px_minmax(0,1fr)_340px]" : "lg:grid-cols-[262px_minmax(0,1fr)]"}`}>
          <LeftRail />
          <main className="min-w-0 border-border lg:border-x">
            <MobileHeader onMenu={() => setMenuOpen(true)} />
            {children}
          </main>
          {right}
        </div>

        <BottomDock onWatch={() => setWatchOpen(true)} />

        <AnimatePresence>{menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} onWatch={() => setWatchOpen(true)} />}</AnimatePresence>
        <AnimatePresence>{watchOpen && <WatchView live={live} onClose={() => setWatchOpen(false)} />}</AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

function LeftRail() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-border px-5 py-6 lg:flex">
      <div className="mb-4 flex flex-col items-center gap-1 border-b border-border pb-5 text-center">
        <Image src={LOGO} alt="St. Catherine of Siena" width={128} height={128} className="h-32 w-32 object-contain" priority />
        <div className="-mt-1 leading-tight">
          <p className="text-[17px] font-semibold">St. Catherine</p>
          <p className="text-[11.5px] text-muted-foreground">of Siena · Burma Camp</p>
        </div>
      </div>
      <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Parish</p>
      <nav className="flex flex-col">
        {NAV.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <Link key={n.label} href={n.href} className={`flex items-center gap-3.5 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${active ? "border-primary bg-primary-soft font-semibold text-primary-deep" : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              <n.icon className="h-[18px] w-[18px]" strokeWidth={2} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <Link href="/donate"><Button className="glow-primary mt-4 w-full">Give</Button></Link>
      <RailAccount />
    </aside>
  );
}

function RailAccount() {
  const { user, loading, signOut } = useAuth();
  if (loading) return <div className="mt-auto h-14 border-t border-border" />;
  if (!user) {
    return (
      <Link href="/login" className="mt-auto flex items-center gap-3 border-t border-border pt-4 text-sm transition-opacity hover:opacity-80">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary-deep"><LogIn className="h-4 w-4" /></span>
        <div><p className="font-semibold leading-tight">Guest</p><p className="text-xs text-primary-deep">Sign in or create account →</p></div>
      </Link>
    );
  }
  const name = displayName(user);
  return (
    <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-gold font-bold text-[hsl(var(--foreground))]">{name[0]?.toUpperCase()}</span>
      <div className="min-w-0 flex-1 text-sm"><p className="truncate font-semibold leading-tight">{name}</p>
        <button onClick={signOut} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><LogOut className="h-3 w-3" /> Sign out</button>
      </div>
    </div>
  );
}

function MobileHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="glass-strong sticky top-0 z-30 flex items-center gap-3 border-b border-border px-4 pb-3 pt-safe lg:hidden">
      <button onClick={onMenu} aria-label="Open menu" className="grid h-10 w-10 place-items-center"><Menu className="h-6 w-6" /></button>
      <Link href="/" className="mx-auto flex items-center gap-2.5">
        <Image src={LOGO} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold">St. Catherine</p>
          <p className="text-[10px] text-muted-foreground">of Siena · Burma Camp</p>
        </div>
      </Link>
      <button aria-label="Notifications" className="grid h-10 w-10 place-items-center"><Bell className="h-5 w-5" /></button>
    </header>
  );
}

function BottomDock({ onWatch }: { onWatch: () => void }) {
  const pathname = usePathname();
  const items = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Radio, label: "Watch Live", watch: true },
    { icon: HandCoins, label: "Give", href: "/donate", give: true },
    { icon: Sparkles, label: "Prayer", href: "/prayer" },
    { icon: Store, label: "Store", href: "/store" },
  ];
  return (
    <nav className="glass fixed inset-x-3.5 bottom-4 z-40 grid grid-cols-5 items-end border border-white/60 p-2 shadow-[0_10px_34px_rgba(15,60,98,0.16)] lg:hidden">
      {items.map((it) => {
        const active = it.href ? (it.href === "/" ? pathname === "/" : pathname.startsWith(it.href)) : false;

        // Give = central raised gold button (FAB-style)
        if (it.give) {
          return (
            <Link key={it.label} href={it.href!} className="flex flex-col items-center justify-end gap-1">
              <span className="glow-gold -mt-6 grid h-12 w-12 place-items-center rounded-full bg-gold text-[#241a05] shadow-lg transition-transform active:scale-90">
                <it.icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <span className={`text-[10px] font-semibold ${active ? "text-primary-deep" : "text-muted-foreground"}`}>{it.label}</span>
            </Link>
          );
        }

        const inner = (
          <>
            {active && <span className="absolute inset-x-1.5 inset-y-0.5 -z-10 rounded-full bg-primary/10" />}
            <it.icon className="h-[22px] w-[22px]" strokeWidth={2} />
            {it.label}
          </>
        );
        const cls = `relative flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold transition-transform active:scale-90 ${active ? "text-primary-deep" : "text-muted-foreground"}`;
        return it.watch ? (
          <motion.button key={it.label} whileTap={{ scale: 0.92 }} onClick={onWatch} className={cls}>{inner}</motion.button>
        ) : (
          <Link key={it.label} href={it.href!} className={cls}>{inner}</Link>
        );
      })}
    </nav>
  );
}

function MobileMenu({ onClose, onWatch }: { onClose: () => void; onWatch: () => void }) {
  const { user, signOut } = useAuth();
  const items = [
    { icon: Home, l: "Home", href: "/" }, { icon: Radio, l: "Watch Live", watch: true },
    { icon: Sparkles, l: "Prayer Wall", href: "/prayer" }, { icon: CalendarDays, l: "Events", href: "/events" },
    { icon: BookOpen, l: "Announcements", href: "/announcements" }, { icon: ImageIcon, l: "Gallery", href: "/gallery" },
    { icon: Store, l: "Store", href: "/store" }, { icon: Settings, l: "Settings", href: "/settings" },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#0f1e30]/40 px-7 pb-8 pt-16 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
      <button onClick={onClose} aria-label="Close" className="absolute right-5 top-8 grid h-10 w-10 place-items-center text-2xl text-white"><X /></button>
      <div className="mb-7 flex flex-col items-center gap-2">
        <Image src={LOGO} alt="" width={96} height={96} className="h-24 w-24 rounded-full bg-white p-1.5 object-contain" />
        <b className="text-lg font-semibold text-white">St. Catherine of Siena</b>
        <small className="text-xs text-sky-100">Burma Camp · Accra</small>
      </div>

      {user ? (
        <div className="mb-4 flex items-center gap-3 bg-white/10 p-3 backdrop-blur-sm">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gold font-bold text-[#241a05]">{displayName(user)[0]?.toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold text-white">{displayName(user)}</p><p className="text-xs text-sky-100">Signed in</p></div>
          <button onClick={() => { signOut(); onClose(); }} className="flex items-center gap-1 text-sm text-white/90"><LogOut className="h-4 w-4" /> Out</button>
        </div>
      ) : (
        <Link href="/login" onClick={onClose} className="mb-4 flex items-center gap-3 bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/15">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-white/15"><LogIn className="h-4 w-4" /></span>
          <div><p className="font-semibold">Sign in</p><p className="text-xs text-sky-100">or continue as guest</p></div>
        </Link>
      )}

      <nav className="flex flex-col">
        {items.map((it) =>
          it.watch ? (
            <button key={it.l} onClick={() => { onClose(); onWatch(); }} className="flex items-center gap-4 border-b border-white/15 py-3.5 text-lg font-medium text-white">
              <it.icon className="h-6 w-6 opacity-90" /> {it.l}
            </button>
          ) : (
            <Link key={it.l} href={it.href!} onClick={onClose} className="flex items-center gap-4 border-b border-white/15 py-3.5 text-lg font-medium text-white">
              <it.icon className="h-6 w-6 opacity-90" /> {it.l}
            </Link>
          )
        )}
      </nav>
      <div className="mt-5 flex items-center justify-between">
        <Link href="/donate" onClick={onClose} className="flex-1 rounded-full bg-white py-3.5 text-center font-semibold text-primary-deep shadow-[0_8px_24px_-8px_rgba(255,255,255,0.4)]">Give</Link>
        <div className="ml-4"><ThemeToggle /></div>
      </div>
    </motion.div>
  );
}

function WatchView({ live, onClose }: { live?: LiveConfig | null; onClose: () => void }) {
  const viewers = useLiveViewers(live?.is_live);
  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.38 }}
      className="fixed inset-0 z-[80] flex flex-col bg-[#080e15]">
      <div className="flex items-center gap-3 px-4 pb-2.5 pt-safe text-white">
        <button onClick={onClose} aria-label="Back to feed" className="grid h-10 w-10 place-items-center"><ChevronLeft className="h-6 w-6" /></button>
        <div><b className="text-sm font-semibold">Back to feed</b><small className="block text-[11px] text-slate-400">{live?.is_live ? (viewers != null && viewers > 0 ? `Live · ${viewers} watching` : "Live now") : "Offline"}</small></div>
      </div>
      <div className="relative aspect-video w-full bg-black">
        {live?.embed_url ? (
          <iframe src={live.embed_url} title="Live" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full" />
        ) : (
          <img src={live?.poster_url || INTERIOR} alt="" className="h-full w-full object-cover opacity-90" />
        )}
        {live?.is_live && (
          <span className="live-chip absolute left-2.5 top-2.5 rounded-full px-2 py-1 text-[10px] font-bold backdrop-blur-sm"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />LIVE</span>
        )}
      </div>
      <div className="flex items-center gap-3 border-b border-[#1e262f] bg-[#12181f] px-4 py-3.5 text-white">
        <RotateCw className="h-6 w-6 flex-none text-sky-400" />
        <div className="flex-1"><b className="block text-[13px] font-semibold">Rotate for full screen</b><small className="text-[11px] text-slate-400">Turn your phone, or stay in portrait</small></div>
        <div className="flex gap-2">
          <button className="glow-primary rounded-full border border-primary bg-primary px-3 py-2 text-[11.5px] font-semibold text-white">Full screen</button>
          <button className="rounded-full border border-[#2b3540] px-3 py-2 text-[11.5px] font-semibold text-slate-300 transition-colors hover:bg-white/5">Stay</button>
        </div>
      </div>
      <div className="border-b border-[#1a222b] px-4 py-3.5 text-white">
        <h2 className="text-[17px] font-semibold">{live?.title || "Sunday Holy Mass — 9:00 AM"}</h2>
        <small className="text-xs text-slate-400">{live?.subtitle}</small>
        <a href="/donate" className="glow-gold mt-3 flex items-center justify-center gap-2 rounded-full bg-gold py-2.5 text-[13px] font-semibold text-[#241a05]"><Gift className="h-4 w-4" /> Give your offering</a>
      </div>
      <div className="min-h-0 flex-1">
        <LiveChat dark />
      </div>
    </motion.div>
  );
}
