"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { fetchLive, type LiveConfig } from "@/lib/data";

/* Instant LIVE state: the ["live"] query is pushed fresh rows over Supabase
   Realtime the moment admin saves, so badges flip without a reload. A slow
   poll remains as a safety net if the websocket drops. */
export function useLiveConfig() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["live"], queryFn: fetchLive, refetchInterval: 60_000 });

  useEffect(() => {
    const ch = supabase
      .channel("live-config")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_stream_config" },
        (payload) => qc.setQueryData(["live"], payload.new as LiveConfig)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return q;
}

/* Real concurrent viewers (YouTube). Polls only while live; null hides the number. */
export function useLiveViewers(isLive: boolean | undefined): number | null {
  const q = useQuery({
    queryKey: ["live-stats"],
    queryFn: async () => {
      const res = await fetch("/api/live/stats");
      if (!res.ok) return { viewers: null };
      return (await res.json()) as { viewers: number | null };
    },
    refetchInterval: 45_000,
    enabled: !!isLive,
  });
  return q.data?.viewers ?? null;
}

export type ArchiveItem = { videoId: string; title: string; publishedAt: string; thumbnail: string | null };

export function useLiveArchive() {
  const q = useQuery({
    queryKey: ["live-archive"],
    queryFn: async () => {
      const res = await fetch("/api/live/archive");
      if (!res.ok) return { items: [] as ArchiveItem[] };
      return (await res.json()) as { items: ArchiveItem[] };
    },
    staleTime: 60 * 60 * 1000,
  });
  return { items: q.data?.items ?? [], isLoading: q.isLoading };
}
