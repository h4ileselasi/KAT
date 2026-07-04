"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Gift } from "lucide-react";
import { SiteShell } from "@/components/site/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveChat } from "@/components/site/live-chat";
import { fetchLive } from "@/lib/data";

const INTERIOR = "/brand/interior.jpg";

function Content() {
  const { data: live, isLoading } = useQuery({ queryKey: ["live"], queryFn: fetchLive });
  return (
    <div className="mx-auto max-w-3xl px-3 pb-32 pt-5 sm:px-6 lg:pb-16">
      {isLoading ? (
        <Skeleton className="aspect-video w-full" />
      ) : (
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {live?.embed_url ? (
            <iframe src={live.embed_url} title="Live" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full" />
          ) : (
            <img src={live?.poster_url || INTERIOR} alt="" className="h-full w-full object-cover opacity-90" />
          )}
          {live?.is_live && (
            <span className="live-chip absolute left-3 top-3 px-2.5 py-1.5 text-[11px] font-bold backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /><span className="num">LIVE{!!live?.viewers && ` · ${live.viewers}`}</span>
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{live?.title || "Sunday Holy Mass — 9:00 AM"}</h1>
          <p className="text-muted-foreground">{live?.subtitle}</p>
        </div>
        <Link href="/donate" className="glow-gold inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-[#241a05]">
          <Gift className="h-4 w-4" /> Give your offering
        </Link>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Live chat</h2>
      <div className="card-surface flex h-[420px] flex-col">
        <LiveChat />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">Be gracious to one another.</p>
    </div>
  );
}

export default function LivePage() {
  return <SiteShell><Content /></SiteShell>;
}
