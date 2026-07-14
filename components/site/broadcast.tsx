"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { nextServiceOccurrence, formatCountdown, type ServiceTime } from "@/lib/live-utils";
import type { ArchiveItem } from "@/lib/use-live";

/* Ticks once per second while mounted; returns null when no schedule. */
export function useCountdown(schedule: ServiceTime[] | null | undefined) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const next = nextServiceOccurrence(schedule, now);
  if (!next) return null;
  return { label: next.label, at: next.at, text: formatCountdown(next.at.getTime() - now.getTime()) };
}

export function ViewerChip({ viewers }: { viewers: number | null }) {
  return (
    <span className="live-chip rounded-full px-2.5 py-1.5 text-[11px] font-bold backdrop-blur-sm">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
      <span className="num">LIVE{viewers != null && viewers > 0 ? ` · ${viewers} watching` : ""}</span>
    </span>
  );
}

export function CountdownHero({ schedule }: { schedule: ServiceTime[] | null | undefined }) {
  const next = useCountdown(schedule);
  if (!next) return null;
  const when = next.at.toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" });
  return (
    <div className="px-6 py-10 text-center sm:py-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">Next service</p>
      <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{next.label}</h2>
      <p className="mt-1 text-sm text-slate-400">{when}</p>
      <p className="num mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">{next.text}</p>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-slate-500">until we&rsquo;re live</p>
    </div>
  );
}

export function ScheduleRows({ schedule }: { schedule: ServiceTime[] | null | undefined }) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (!schedule?.length) return null;
  return (
    <div className="border-t border-white/10">
      <h3 className="px-5 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Weekly services</h3>
      {schedule.map((s, i) => (
        <div key={i} className="flex items-baseline gap-4 border-b border-white/5 px-5 py-3.5 last:border-0">
          <span className="num w-24 flex-none text-[13px] font-semibold text-sky-300">{days[s.day] ?? "—"}</span>
          <span className="num flex-none text-[13px] text-slate-400">{s.time}</span>
          <span className="text-[14px] font-medium text-slate-100">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ArchiveGrid({ items, onPlay }: { items: ArchiveItem[]; onPlay: (videoId: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="px-5 py-6">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Previous services</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((v) => (
          <button key={v.videoId} onClick={() => onPlay(v.videoId)}
            className="zoom-media group relative overflow-hidden bg-black text-left">
            <div className="aspect-video w-full">
              {v.thumbnail ? (
                <img src={v.thumbnail} alt="" className="h-full w-full object-cover opacity-80 group-hover:opacity-100" />
              ) : (
                <div className="h-full w-full bg-white/5" />
              )}
            </div>
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <span className="absolute left-1/2 top-[38%] grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-white/15 pl-0.5 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              <Play className="h-4 w-4" fill="currentColor" />
            </span>
            <span className="absolute inset-x-2.5 bottom-2 text-white">
              <b className="block truncate text-[12px] font-semibold">{v.title}</b>
              <small className="num text-[10.5px] text-slate-300">
                {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""}
              </small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
