import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractYouTubeId } from "@/lib/live-utils";

export const dynamic = "force-dynamic";

export type ArchiveItem = { videoId: string; title: string; publishedAt: string; thumbnail: string | null };

// Past services from YouTube. Source: the admin-set playlist id, else the
// channel uploads playlist resolved from the current embed URL's video.
// Cached ~1h per instance. Degrades to { items: [] } without a key/config.
let cache: { at: number; sourceKey: string; items: ArchiveItem[] } = { at: 0, sourceKey: "", items: [] };
let uploadsCache: { videoId: string; playlistId: string } | null = null;
const TTL_MS = 60 * 60 * 1000;

async function yt(path: string, key: string): Promise<any> {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}&key=${key}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`youtube ${res.status}`);
  return res.json();
}

async function resolveUploadsPlaylist(videoId: string, key: string): Promise<string | null> {
  if (uploadsCache?.videoId === videoId) return uploadsCache.playlistId;
  const vid = await yt(`videos?part=snippet&id=${videoId}`, key);
  const channelId = vid?.items?.[0]?.snippet?.channelId;
  if (!channelId) return null;
  const ch = await yt(`channels?part=contentDetails&id=${channelId}`, key);
  const playlistId = ch?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (playlistId) uploadsCache = { videoId, playlistId };
  return playlistId ?? null;
}

export async function GET() {
  const key = process.env.YOUTUBE_API_KEY;
  const { data: cfg } = await supabaseAdmin
    .from("live_stream_config")
    .select("is_live, embed_url, youtube_playlist_id")
    .eq("id", 1)
    .single();
  if (!key || !cfg) return NextResponse.json({ items: [] });

  const currentVideoId = extractYouTubeId(cfg.embed_url);
  const sourceKey = cfg.youtube_playlist_id || `uploads:${currentVideoId ?? ""}`;
  if (cache.sourceKey === sourceKey && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json({ items: cache.items });
  }

  try {
    let playlistId = cfg.youtube_playlist_id;
    if (!playlistId && currentVideoId) playlistId = await resolveUploadsPlaylist(currentVideoId, key);
    if (!playlistId) return NextResponse.json({ items: [] });

    const list = await yt(`playlistItems?part=snippet&playlistId=${playlistId}&maxResults=13`, key);
    const items: ArchiveItem[] = (list?.items ?? [])
      .map((it: any) => ({
        videoId: it?.snippet?.resourceId?.videoId ?? "",
        title: it?.snippet?.title ?? "",
        publishedAt: it?.snippet?.publishedAt ?? "",
        thumbnail: it?.snippet?.thumbnails?.medium?.url ?? null,
      }))
      .filter((it: ArchiveItem) => it.videoId && it.videoId !== (cfg.is_live ? currentVideoId : ""))
      .slice(0, 12);
    cache = { at: Date.now(), sourceKey, items };
  } catch {
    cache = { at: Date.now(), sourceKey, items: [] };
  }
  return NextResponse.json({ items: cache.items });
}
