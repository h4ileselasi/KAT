"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Flame, Share2, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSite } from "@/components/site/shell";
import { useAuth, displayName } from "@/components/auth/auth-provider";
import { useLiveViewers } from "@/lib/use-live";
import { useCountdown } from "@/components/site/broadcast";
import { FadeUp } from "@/components/site/motion";
import {
  fetchAnnouncements, fetchEvents, fetchPrayers, lightCandle, lightAnnouncementCandle,
  type Announcement, type EventItem, type Prayer, type LiveConfig,
} from "@/lib/data";

const INTERIOR = "/brand/interior.jpg";

const maskStyle = (src: string) => ({
  WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`,
  WebkitMaskSize: "contain", maskSize: "contain",
  WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
  WebkitMaskPosition: "center", maskPosition: "center",
});

export function StoryRow() {
  const { live, openWatch } = useSite();
  const shortcuts = [
    { icon: "/icons/news.png", l: "News", href: "/announcements" },
    { icon: "/icons/prayer.png", l: "Prayer", href: "/prayer" },
    { icon: "/icons/events.png", l: "Events", href: "/events" },
    { icon: "/icons/gallery.png", l: "Gallery", href: "/gallery" },
  ];
  return (
    <div className="no-scrollbar mb-4 flex justify-center gap-2 overflow-x-auto pb-3">
      <button onClick={openWatch} className="w-[68px] flex-none text-center">
        <span className={`grid h-16 w-16 place-items-center rounded-full p-[3px] ${live?.is_live ? "bg-destructive live-pulse" : "bg-gradient-to-br from-primary to-gold"}`}>
          <span className="h-full w-full rounded-full border-[3px] border-background bg-cover bg-center" style={{ backgroundImage: `url(${live?.poster_url || INTERIOR})` }} />
        </span>
        {live?.is_live ? (
          <span className="relative -mt-2 inline-block rounded-full bg-destructive px-2 py-px text-[8.5px] font-bold tracking-wide text-white">LIVE</span>
        ) : (
          <span className="mt-1.5 block truncate text-[10.5px] text-muted-foreground">Watch</span>
        )}
      </button>
      {shortcuts.map((s) => (
        <a key={s.l} href={s.href} className="w-[68px] flex-none text-center">
          <span className="story-ring mx-auto grid h-16 w-16 place-items-center rounded-full p-[2.5px]">
            <span className="grid h-full w-full place-items-center rounded-full border-[3px] border-background bg-primary-soft">
              <span className="h-7 w-7 bg-primary-deep" style={maskStyle(s.icon)} aria-hidden />
            </span>
          </span>
          <span className="mt-1.5 block truncate text-[10.5px] text-muted-foreground">{s.l}</span>
        </a>
      ))}
    </div>
  );
}

export function LiveCard() {
  const { live, openWatch } = useSite();
  const viewers = useLiveViewers(live?.is_live);
  const next = useCountdown(live?.is_live ? null : live?.schedule);
  return (
    <div className={`mb-4 lg:hidden ${live?.is_live ? "gradient-frame-live" : ""}`}>
      <button onClick={openWatch} className="relative block h-[210px] w-full overflow-hidden bg-black text-left">
        <img src={live?.poster_url || INTERIOR} alt="" className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-gradient-to-b from-black/10 to-[#091420]/75" />
        {live?.is_live ? (
          <span className="live-chip absolute left-3 top-3 rounded-full px-2.5 py-1.5 text-[10.5px] font-bold tracking-wide backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
            <span className="num">LIVE{viewers != null && viewers > 0 ? ` · ${viewers}` : ""}</span>
          </span>
        ) : next ? (
          <span className="num absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1.5 text-[10.5px] font-semibold text-white backdrop-blur-sm">
            {next.label} · in {next.text}
          </span>
        ) : null}
        <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-white/60 bg-white/20 pl-1 text-white backdrop-blur"><Play className="h-6 w-6" fill="currentColor" /></span>
        <span className="absolute inset-x-4 bottom-3 text-white">
          <b className="block text-[15px] font-semibold">{live?.title || "Sunday Holy Mass"}</b>
          <small className="text-[11.5px] text-slate-300">Tap to watch · {live?.subtitle}</small>
        </span>
      </button>
    </div>
  );
}

export function AnnouncementPost({ item }: { item: Announcement }) {
  return (
    <article className="card-surface card-surface-interactive">
      <div className="flex items-center gap-3 px-4 pb-2 pt-4">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary-soft text-primary-deep">✝</span>
        <div className="leading-tight"><p className="text-sm font-semibold">Parish Office</p><p className="text-xs text-muted-foreground">Announcement</p></div>
        {item.pinned && <span className="ml-auto rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-deep">Pinned</span>}
      </div>
      <div className="px-4 pb-3"><p className="text-[15px] font-medium leading-relaxed">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.body}</p></div>
      {item.image_url && <img src={item.image_url} alt="" className="max-h-[340px] w-full border-y border-border object-cover" />}
      <div className="flex px-3 py-1.5">
        <AnnouncementCandleButton id={item.id} count={item.candles ?? 0} />
        <button className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><Share2 className="h-4 w-4" /> Share</button>
      </div>
    </article>
  );
}

export function PrayerPost({ item }: { item: Prayer }) {
  return (
    <article className="card-surface card-surface-interactive">
      <div className="flex items-center gap-3 px-4 pb-2 pt-4">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gold-soft text-gold">✦</span>
        <div className="leading-tight"><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">Mass intention</p></div>
      </div>
      <div className="px-4 pb-3">
        <p className="border-l-2 border-gold pl-4 text-[15px] font-light italic leading-relaxed">{item.intention}</p>
      </div>
      <div className="flex px-3 py-1.5"><CandleButton prayerId={item.id} count={item.candles} /></div>
    </article>
  );
}

/* Pixel-art candle sprite (crisp blocky rects, flickering pixel flame). */
function PixelCandle() {
  return (
    <svg width="16" height="22" viewBox="0 0 12 16" shapeRendering="crispEdges" aria-hidden>
      <g className="pixel-flame">
        <rect x="5" y="0" width="2" height="1" fill="#fff3b0" />
        <rect x="4" y="1" width="4" height="3" fill="#ffb02e" />
        <rect x="5" y="2" width="2" height="2" fill="#ff7a00" />
      </g>
      <rect x="5" y="4" width="2" height="1" fill="#4a3220" />
      <rect x="3" y="5" width="6" height="9" fill="#f5ead0" />
      <rect x="3" y="5" width="1" height="9" fill="#e6d6ac" />
      <rect x="8" y="5" width="1" height="9" fill="#d8c497" />
      <rect x="2" y="14" width="8" height="2" fill="#c9a24a" />
    </svg>
  );
}

function PixelCandleRise() {
  return (
    <span className="pixel-rise pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2" aria-hidden>
      <PixelCandle />
    </span>
  );
}

/* Presentational candle button — a pixel candle floats up + the flame flickers
   on light. The COUNT reflects the query cache directly (the parent bumps it
   optimistically), so it's never double-added. */
function CandleButtonView({ count, lit, onLight, label, burstKey }: {
  count: number; lit: boolean; onLight: () => void; label: string; burstKey: number;
}) {
  return (
    <button onClick={onLight} className={`group flex items-center gap-2 px-4 py-2 text-[13px] font-semibold transition-colors ${lit ? "text-primary-deep" : "text-muted-foreground hover:text-primary-deep"}`}>
      <span className="relative grid place-items-center">
        {burstKey > 0 && <PixelCandleRise key={burstKey} />}
        {lit && <span className="candle-burst pointer-events-none absolute h-5 w-5 rounded-full bg-gold/40" aria-hidden />}
        <Flame className={`h-4 w-4 transition-transform ${lit ? "fill-gold text-gold flame-flicker" : "group-hover:scale-110"}`} />
      </span>
      {label} · <span className="num">{count}</span>
    </button>
  );
}

export function CandleButton({ prayerId, count }: { prayerId: number; count: number }) {
  const qc = useQueryClient();
  const [lit, setLit] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const mutation = useMutation({
    mutationFn: () => lightCandle(prayerId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["prayers"] });
      const prev = qc.getQueryData<Prayer[]>(["prayers"]);
      qc.setQueryData<Prayer[]>(["prayers"], (old) => old?.map((p) => (p.id === prayerId ? { ...p, candles: p.candles + 1 } : p)));
      return { prev };
    },
    onError: (_e, _v, ctx) => { setLit(false); if (ctx?.prev) qc.setQueryData(["prayers"], ctx.prev); },
  });
  const light = () => { if (lit) return; setLit(true); setBurstKey((k) => k + 1); mutation.mutate(); };
  return <CandleButtonView count={count} lit={lit} onLight={light} label="Pray with" burstKey={burstKey} />;
}

export function AnnouncementCandleButton({ id, count }: { id: number; count: number }) {
  const qc = useQueryClient();
  const [lit, setLit] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const mutation = useMutation({
    mutationFn: () => lightAnnouncementCandle(id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["announcements"] });
      const prev = qc.getQueryData<Announcement[]>(["announcements"]);
      qc.setQueryData<Announcement[]>(["announcements"], (old) => old?.map((a) => (a.id === id ? { ...a, candles: (a.candles ?? 0) + 1 } : a)));
      return { prev };
    },
    onError: (_e, _v, ctx) => { setLit(false); if (ctx?.prev) qc.setQueryData(["announcements"], ctx.prev); },
  });
  const light = () => { if (lit) return; setLit(true); setBurstKey((k) => k + 1); mutation.mutate(); };
  return <CandleButtonView count={count} lit={lit} onLight={light} label="Light a candle" burstKey={burstKey} />;
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card-surface p-4">
          <div className="mb-3 flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-2.5 w-1/4" /></div></div>
          <Skeleton className="mb-2 h-3 w-full" /><Skeleton className="mb-2 h-3 w-4/5" />
          {i === 0 && <Skeleton className="mt-3 h-40 w-full" />}
        </div>
      ))}
    </div>
  );
}

export function RightSidebar() {
  const { live, openWatch } = useSite();
  const viewers = useLiveViewers(live?.is_live);
  const next = useCountdown(live?.is_live ? null : live?.schedule);
  const events = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  return (
    <aside className="sticky top-0 hidden h-[100dvh] flex-col gap-4 overflow-auto px-5 py-6 lg:flex">
      <div className={live?.is_live ? "gradient-frame-live" : ""}>
      <div className="card-surface card-surface-interactive overflow-hidden">
        <button onClick={openWatch} className="relative block h-[172px] w-full overflow-hidden">
          <img src={live?.poster_url || INTERIOR} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-b from-transparent to-[#091420]/75" />
          {live?.is_live ? (
            <span className="live-chip absolute left-3 top-3 rounded-full px-2 py-1 text-[10.5px] font-bold backdrop-blur-sm"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /><span className="num">LIVE{viewers != null && viewers > 0 ? ` · ${viewers}` : ""}</span></span>
          ) : next ? (
            <span className="num absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10.5px] font-semibold text-white backdrop-blur-sm">{next.label} · in {next.text}</span>
          ) : null}
          <span className="absolute inset-x-3.5 bottom-3 text-left text-white"><b className="block text-sm font-semibold">{live?.title || "Sunday Holy Mass"}</b><small className="text-[11.5px] text-slate-300">{live?.subtitle}</small></span>
        </button>
        <button onClick={openWatch} className="glow-primary block w-full bg-primary py-3 text-center text-[13.5px] font-semibold text-primary-foreground hover:bg-primary-deep">Join the service</button>
      </div>
      </div>
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5"><b className="text-[13px] font-semibold">Upcoming events</b><a href="/events" className="text-xs font-medium text-primary hover:underline">All →</a></div>
        {events.isLoading ? <div className="space-y-2 p-4"><Skeleton className="h-10" /><Skeleton className="h-10" /></div> :
          (events.data ?? []).slice(0, 3).map((e) => (
            <div key={e.id} className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-secondary/60">
              <div className="num grid h-12 w-12 flex-none place-items-center bg-primary-soft text-center leading-none text-primary-deep">
                <b className="text-[17px] font-bold">{e.date.split(" ")[1]}</b><small className="text-[9.5px] uppercase tracking-wider">{e.date.split(" ")[0]}</small>
              </div>
              <div><b className="block text-[13.5px] font-semibold">{e.title}</b><small className="num text-xs text-muted-foreground">{e.day} · {e.time} · {e.location}</small></div>
            </div>
          ))}
      </div>
      <div className="overflow-hidden bg-primary-ink text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_12px_32px_-16px_rgba(15,60,98,0.5)]">
        <div className="px-4 pb-1 pt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">Give</p><h3 className="mt-2 text-[17px] font-semibold text-white">Support the mission</h3></div>
        <p className="px-4 text-[12.5px] leading-relaxed text-slate-200">Your generosity keeps us on air. MoMo, Telecel, or card.</p>
        <div className="grid grid-cols-2 gap-2 px-4 pb-1.5 pt-3.5 text-[13.5px] font-semibold">
          {[20, 50, 100, 200].map((v, i) => (
            <Link key={v} href={`/donate?amount=${v}`} className={`num rounded-full border p-2.5 text-center transition-colors ${i === 1 ? "border-gold bg-gold text-[#241a05]" : "border-white/25 text-white hover:bg-white/10"}`}>GHS {v}</Link>
          ))}
        </div>
        <Link href="/donate" className="glow-gold m-4 block rounded-full bg-gold py-3 text-center text-sm font-semibold text-[#241a05]">Give an offering</Link>
      </div>
    </aside>
  );
}

/* HOME FEED — the center column content for "/" */
export function HomeFeed() {
  const { user } = useAuth();
  const announcements = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
  const prayers = useQuery({ queryKey: ["prayers"], queryFn: fetchPrayers });
  const loading = announcements.isLoading || prayers.isLoading;
  return (
    <div className="mx-auto max-w-2xl px-3 pb-32 pt-4 sm:px-6 lg:pb-16">
      <StoryRow />
      <LiveCard />
      <Link href="/prayer" className="card-surface card-surface-interactive mb-6 flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary-soft font-semibold text-primary-deep">{user ? displayName(user)[0]?.toUpperCase() : "✦"}</span>
        <span className="min-w-0 flex-1 text-sm text-muted-foreground">Share a Mass intention or a word of encouragement…</span>
        <Button size="sm" className="glow-primary" asChild><span>Post</span></Button>
      </Link>
      {loading ? <FeedSkeleton /> : (
        <div className="space-y-4">
          {announcements.data?.slice(0, 2).map((a, i) => <FadeUp key={a.id} delay={Math.min(i * 0.06, 0.3)}><AnnouncementPost item={a} /></FadeUp>)}
          {prayers.data?.[0] && <FadeUp delay={0.12}><PrayerPost item={prayers.data[0]} /></FadeUp>}
          {announcements.data?.slice(2, 3).map((a) => <FadeUp key={a.id} delay={0.18}><AnnouncementPost item={a} /></FadeUp>)}
          {prayers.data?.slice(1, 3).map((p, i) => <FadeUp key={p.id} delay={Math.min(0.24 + i * 0.06, 0.3)}><PrayerPost item={p} /></FadeUp>)}
        </div>
      )}
    </div>
  );
}
