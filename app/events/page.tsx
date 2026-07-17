"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Clock, Plus } from "lucide-react";
import { SiteShell } from "@/components/site/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeUp } from "@/components/site/motion";
import { fetchEvents } from "@/lib/data";

function Content() {
  const q = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  return (
    <FadeUp className="mx-auto max-w-2xl px-3 pb-32 pt-5 sm:px-6 lg:pb-16">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary-deep"><CalendarDays className="h-5 w-5" /></span>
        <div><h1 className="text-2xl font-semibold tracking-tight">Events</h1><p className="text-sm text-muted-foreground">What's happening at St. Catherine.</p></div>
      </div>
      {q.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {(q.data ?? []).map((e) => (
            <article key={e.id} className="card-surface card-surface-interactive overflow-hidden">
              {e.image_url && <img src={e.image_url} alt="" className="h-40 w-full object-cover" />}
              <div className="flex items-center gap-4 p-4">
                <div className="num grid h-16 w-16 flex-none place-items-center bg-gradient-to-br from-primary to-primary-deep text-center leading-none text-white shadow-[0_6px_16px_-6px_hsl(var(--primary)/0.5)]">
                  <b className="text-2xl font-bold">{e.date.split(" ")[1]}</b>
                  <small className="text-[10px] uppercase tracking-wider">{e.date.split(" ")[0]}</small>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-semibold">{e.title}</h3>
                  <p className="num mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {e.day} · {e.time}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {e.location}</span>
                  </p>
                </div>
                <button className="hidden items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-[13px] font-semibold text-primary-deep transition-colors hover:bg-primary-soft sm:inline-flex">
                  <Plus className="h-4 w-4" /> Calendar
                </button>
              </div>
            </article>
          ))}
          {q.data?.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No events scheduled yet — check back after Sunday Mass.</p>}
        </div>
      )}
    </FadeUp>
  );
}

export default function EventsPage() {
  return <SiteShell><Content /></SiteShell>;
}
