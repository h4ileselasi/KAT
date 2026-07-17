"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
import { SiteShell } from "@/components/site/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveChat } from "@/components/site/live-chat";
import { FadeUp } from "@/components/site/motion";
import { CountdownHero, ScheduleRows, ArchiveGrid, ViewerChip } from "@/components/site/broadcast";
import { useLiveConfig, useLiveViewers, useLiveArchive } from "@/lib/use-live";

const INTERIOR = "/brand/interior.jpg";

/* The Broadcast room — deliberately dark-cinematic in BOTH themes (nested
   `dark` class flips all tokens for descendants). */
function Content() {
  const { data: live, isLoading } = useLiveConfig();
  const viewers = useLiveViewers(live?.is_live);
  const archive = useLiveArchive();
  const [replayId, setReplayId] = useState<string | null>(null);

  const embedSrc = replayId
    ? `https://www.youtube.com/embed/${replayId}?autoplay=1`
    : live?.embed_url || null;
  const showPlayer = !!embedSrc && (!!replayId || !!live?.is_live);

  return (
    <div className="dark min-h-[100dvh] bg-[#080e15] pb-32 text-slate-100 lg:pb-10">
      <div className="ambient-stage mx-auto max-w-6xl px-3 pt-5 sm:px-6">
        <div className="gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* --- Player column --- */}
          <FadeUp>
            {isLoading ? (
              <Skeleton className="aspect-video w-full" />
            ) : (
              <div className={live?.is_live && !replayId ? "gradient-frame-live" : ""}>
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  {showPlayer ? (
                    <iframe src={embedSrc!} title={replayId ? "Previous service" : "Live"}
                      allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full" />
                  ) : (
                    <img src={live?.poster_url || INTERIOR} alt="" className="h-full w-full object-cover opacity-60" />
                  )}
                  {live?.is_live && !replayId && (
                    <span className="absolute left-3 top-3"><ViewerChip viewers={viewers} /></span>
                  )}
                  {replayId && (
                    <button onClick={() => setReplayId(null)}
                      className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur hover:bg-black/70">
                      ← Back to {live?.is_live ? "live" : "today"}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3 px-1">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">{live?.title || "Sunday Holy Mass — 9:00 AM"}</h1>
                <p className="text-sm text-slate-400">{live?.subtitle}</p>
              </div>
              <Link href="/donate" className="glow-gold inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-[#241a05]">
                <Gift className="h-4 w-4" /> Give your offering
              </Link>
            </div>

            {!live?.is_live && !replayId && (
              <div className="mt-4 border border-white/10 bg-white/[0.03]">
                <CountdownHero schedule={live?.schedule} />
                <ScheduleRows schedule={live?.schedule} />
              </div>
            )}

            {archive.items.length > 0 && (
              <div className="mt-2 border border-white/10 bg-white/[0.03]">
                <ArchiveGrid items={archive.items} onPlay={setReplayId} />
              </div>
            )}
          </FadeUp>

          {/* --- Chat rail (sticky on desktop, stacked on mobile) --- */}
          <FadeUp delay={0.08} className="mt-6 lg:sticky lg:top-5 lg:mt-0">
            <div className="flex h-[440px] flex-col border border-white/10 bg-[#0c141d] lg:h-[calc(100dvh-40px)]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <b className="text-[13px] font-semibold text-slate-100">Live chat</b>
                {live?.is_live && <ViewerChip viewers={viewers} />}
              </div>
              <div className="min-h-0 flex-1"><LiveChat dark /></div>
            </div>
            <p className="mt-2 pb-4 text-center text-xs text-slate-500">Be gracious to one another.</p>
          </FadeUp>
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  return <SiteShell><Content /></SiteShell>;
}
