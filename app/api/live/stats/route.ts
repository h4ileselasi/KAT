import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractYouTubeId } from "@/lib/live-utils";

export const dynamic = "force-dynamic";

// Concurrent viewers for the current live video, via YouTube Data API v3.
// Cached in module memory (~45s per serverless instance) so client polling
// can't multiply quota usage. Degrades to { viewers: null } without a key.
let cache: { at: number; videoId: string; viewers: number | null } = { at: 0, videoId: "", viewers: null };
const TTL_MS = 45_000;

export async function GET() {
  const { data: cfg } = await supabaseAdmin
    .from("live_stream_config")
    .select("is_live, embed_url")
    .eq("id", 1)
    .single();

  const key = process.env.YOUTUBE_API_KEY;
  const videoId = extractYouTubeId(cfg?.embed_url);
  if (!cfg?.is_live || !videoId || !key) return NextResponse.json({ viewers: null });

  if (cache.videoId === videoId && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json({ viewers: cache.viewers });
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${key}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`youtube ${res.status}`);
    const json = await res.json();
    const raw = json?.items?.[0]?.liveStreamingDetails?.concurrentViewers;
    const viewers = raw ? Number(raw) : null;
    cache = { at: Date.now(), videoId, viewers: Number.isFinite(viewers) ? viewers : null };
  } catch {
    cache = { at: Date.now(), videoId, viewers: null }; // don't hammer on failure
  }
  return NextResponse.json({ viewers: cache.viewers });
}
