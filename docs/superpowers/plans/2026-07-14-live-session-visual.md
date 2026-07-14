# KAT Live Session Completion + Full Bold 2026 Visual Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the live stream session experience (real YouTube viewer count, fresh chat per service, instant LIVE state, realtime chat, offline countdown/schedule, past-services archive) and apply the approved "Full bold 2026" visual pass across the public site, then deploy to Vercel.

**Architecture:** Hybrid YouTube-native — the single-row `live_stream_config` stays the source of truth; YouTube Data API v3 supplies viewer count and archive via two new server routes; Supabase Realtime supplies instant LIVE state and instant chat. No new tables. Visuals: CSS gradient/glass/glow utilities + framer-motion entrances layered onto the existing token system; the live page becomes a dark "Broadcast" room.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind 3.4, Supabase (@supabase/ssr + supabase-js v2, Realtime), React Query v5, framer-motion, YouTube Data API v3, node:test (Node 24 type-stripping) for pure logic.

**Spec:** `docs/superpowers/specs/2026-07-14-live-session-visual-design.md` (approved 2026-07-14).

## Global Constraints

- Brand: Marian blue `#2b7cc0` / deep `#175488` / ink `#0f3c62`, gold `#c19a3e`; Poppins. Use existing HSL tokens (`--primary`, `--gold`, etc.) — never hardcode new hex values in components.
- Sharp corners on cards/containers (~0–3px, `--radius: 2px`); pills/rounded-full ONLY on chips, buttons, toggles, avatars.
- Light AND dark themes must both work on every changed surface; the live page is deliberately dark-cinematic in both themes (nested `dark` class wrapper).
- Admin (`app/admin/**`, `components/admin/**`) is visually untouched. Only functional additions to the admin Live tab (styled to match existing admin inputs: `focus-visible:ring-emerald-500`).
- Ambient/bold effects are pure CSS (gradients/blur) — no image assets. Perpetual animation only on LIVE elements. `prefers-reduced-motion` must be respected (global CSS kill-switch exists; add `MotionConfig reducedMotion="user"` for framer-motion).
- `YOUTUBE_API_KEY` is server-only — never expose to the client bundle, never prefix with `NEXT_PUBLIC_`. All YouTube calls happen in route handlers. Code must degrade gracefully when the key is absent (viewers: null, archive: []).
- Never import `@/lib/supabaseAdmin` into any file reachable from a `"use client"` component (crashes the site + leaks the service key — this bit us before).
- The user's editor may auto-convert straight quotes to curly quotes in open files (broke the build once). If the dev server reports a syntax error with `"` or `'` characters, check for smart quotes.
- Dev server: from the GENESIS session use the `kat-dev` launch config (port 3010). Manually: `npm --prefix C:\Users\HP\Desktop\KAT run dev -- -p 3010`. Node v24 is on PATH (`C:\Program Files\nodejs` if a shell is missing it).
- Work on branch `live-session-2026`. Commit after every task. Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Repo has no test framework; pure logic is tested with Node's built-in `node:test` runner (`.mjs` test files in `scripts/` importing `.ts` modules via Node 24 type stripping — keep tested modules to erasable-TS only: no enums, no namespaces). Routes/UI are verified against the running dev server.

---

### Task 1: Database migration — session columns + realtime publication

**Files:**
- Modify: `supabase/schema.sql` (append at end)
- Create: `scripts/verify-live-schema.js`

**Interfaces:**
- Produces: columns `live_stream_config.session_started_at timestamptz`, `live_stream_config.youtube_playlist_id text`, `live_stream_config.schedule jsonb default '[]'`; tables `chat_messages` + `live_stream_config` in the `supabase_realtime` publication.

- [ ] **Step 1: Append the migration block to `supabase/schema.sql`**

```sql
-- ============================================================
-- LIVE SESSIONS (2026-07-14): session-scoped chat, schedule,
-- YouTube archive + realtime for instant LIVE state and chat.
-- ============================================================
ALTER TABLE live_stream_config ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE live_stream_config ADD COLUMN IF NOT EXISTS youtube_playlist_id TEXT;
ALTER TABLE live_stream_config ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '[]'::jsonb;

-- Realtime: postgres_changes events for chat inserts + live config updates.
-- Publication membership is not idempotent via ADD TABLE, so guard each one.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_stream_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_stream_config;
  END IF;
END $$;
```

- [ ] **Step 2: Apply the migration**

Run: `node C:\Users\HP\Desktop\KAT\scripts\migrate.js`
Expected: `✅ Schema applied successfully.` and the tables list.

- [ ] **Step 3: Create `scripts/verify-live-schema.js`**

```js
/** Verifies the live-session migration landed. Run: node scripts/verify-live-schema.js */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const cols = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'live_stream_config'
       AND column_name IN ('session_started_at','youtube_playlist_id','schedule')`
  );
  const pub = await client.query(
    `SELECT tablename FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND tablename IN ('chat_messages','live_stream_config')`
  );
  console.log("columns:", cols.rows.map((r) => r.column_name).sort().join(", "));
  console.log("realtime:", pub.rows.map((r) => r.tablename).sort().join(", "));
  const ok = cols.rows.length === 3 && pub.rows.length === 2;
  console.log(ok ? "✅ live-session schema OK" : "❌ MISSING PIECES");
  await client.end();
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
```

- [ ] **Step 4: Run verification**

Run: `node C:\Users\HP\Desktop\KAT\scripts\verify-live-schema.js`
Expected: `columns: schedule, session_started_at, youtube_playlist_id`, `realtime: chat_messages, live_stream_config`, `✅ live-session schema OK`

- [ ] **Step 5: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add supabase/schema.sql scripts/verify-live-schema.js
git -C C:/Users/HP/Desktop/KAT commit -m "feat(db): session stamp, schedule, playlist id + realtime publication"
```

---

### Task 2: Pure live utilities (TDD)

**Files:**
- Create: `lib/live-utils.ts`
- Test: `scripts/live-utils.test.mjs`

**Interfaces:**
- Produces (exact signatures, consumed by Tasks 4, 5, 8, 10, 11):

```ts
export type ServiceTime = { day: number; time: string; label: string }; // day: 0=Sunday..6=Saturday, time "HH:MM" 24h
export function extractYouTubeId(url: string | null | undefined): string | null;
export function nextServiceOccurrence(schedule: ServiceTime[] | null | undefined, now: Date): { label: string; at: Date } | null;
export function formatCountdown(ms: number): string; // "2d 14h 03m" | "14h 03m 22s" | "03m 22s"
```

- [ ] **Step 1: Write the failing test `scripts/live-utils.test.mjs`**

(`.mjs` on purpose: excluded from Next's type-check, and Node 24 strips types from the imported `.ts` natively.)

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractYouTubeId, nextServiceOccurrence, formatCountdown } from "../lib/live-utils.ts";

test("extractYouTubeId handles all URL shapes", () => {
  assert.equal(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://www.youtube.com/live/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://vimeo.com/12345"), null);
  assert.equal(extractYouTubeId(""), null);
  assert.equal(extractYouTubeId(null), null);
});

test("nextServiceOccurrence picks the soonest future service", () => {
  // Tue 2026-07-14 10:00 local
  const now = new Date(2026, 6, 14, 10, 0, 0);
  const schedule = [
    { day: 0, time: "09:00", label: "Sunday Holy Mass" },
    { day: 5, time: "18:30", label: "Friday Adoration" },
  ];
  const next = nextServiceOccurrence(schedule, now);
  assert.equal(next.label, "Friday Adoration");
  assert.equal(next.at.getDay(), 5);
  assert.equal(next.at.getHours(), 18);
  assert.equal(next.at.getMinutes(), 30);
  assert.ok(next.at > now);
});

test("nextServiceOccurrence rolls same-day past time to next week", () => {
  // Sunday 2026-07-12 10:00 — 09:00 Mass already passed
  const now = new Date(2026, 6, 12, 10, 0, 0);
  const next = nextServiceOccurrence([{ day: 0, time: "09:00", label: "Mass" }], now);
  assert.equal(next.at.getDate(), 19); // next Sunday
});

test("nextServiceOccurrence handles empty/invalid input", () => {
  const now = new Date();
  assert.equal(nextServiceOccurrence([], now), null);
  assert.equal(nextServiceOccurrence(null, now), null);
  assert.equal(nextServiceOccurrence([{ day: 9, time: "xx", label: "bad" }], now), null);
});

test("formatCountdown tiers", () => {
  assert.equal(formatCountdown((2 * 86400 + 14 * 3600 + 3 * 60) * 1000), "2d 14h 03m");
  assert.equal(formatCountdown((14 * 3600 + 3 * 60 + 22) * 1000), "14h 03m 22s");
  assert.equal(formatCountdown((3 * 60 + 22) * 1000), "03m 22s");
  assert.equal(formatCountdown(-5000), "00m 00s");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test C:\Users\HP\Desktop\KAT\scripts\live-utils.test.mjs`
Expected: FAIL — `Cannot find module ... lib/live-utils.ts`

- [ ] **Step 3: Implement `lib/live-utils.ts`**

```ts
// Pure helpers for the live session experience. No imports — kept erasable-TS
// so node:test can run them directly via Node 24 type stripping.

export type ServiceTime = { day: number; time: string; label: string };

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:embed\/|live\/|watch\?(?:.*&)?v=)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/
  );
  return m ? m[1] : null;
}

export function nextServiceOccurrence(
  schedule: ServiceTime[] | null | undefined,
  now: Date
): { label: string; at: Date } | null {
  let best: { label: string; at: Date } | null = null;
  for (const s of schedule ?? []) {
    if (typeof s?.day !== "number" || s.day < 0 || s.day > 6) continue;
    if (!/^\d{1,2}:\d{2}$/.test(s?.time ?? "")) continue;
    const [hh, mm] = s.time.split(":").map(Number);
    const at = new Date(now);
    at.setHours(hh, mm, 0, 0);
    at.setDate(at.getDate() + ((s.day - now.getDay() + 7) % 7));
    if (at <= now) at.setDate(at.getDate() + 7);
    if (!best || at < best.at) best = { label: s.label, at };
  }
  return best;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${h}h ${pad(m)}m`;
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  return `${pad(m)}m ${pad(s)}s`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test C:\Users\HP\Desktop\KAT\scripts\live-utils.test.mjs`
Expected: `# pass 5`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add lib/live-utils.ts scripts/live-utils.test.mjs
git -C C:/Users/HP/Desktop/KAT commit -m "feat: live session pure utils (youtube id, next service, countdown) with node:test coverage"
```

---

### Task 3: Data layer — LiveConfig fields, session-scoped chat, session stamp on go-live

**Files:**
- Modify: `lib/data.ts:31-39` (LiveConfig type), `lib/data.ts:128-135` (fetchChat)
- Modify: `app/api/admin/live/route.js:13-28` (PATCH)

**Interfaces:**
- Consumes: `ServiceTime` from `lib/live-utils.ts` (Task 2).
- Produces: `LiveConfig` gains `session_started_at: string | null; youtube_playlist_id: string | null; schedule: ServiceTime[] | null;` (`viewers` stays for now — removed in Task 11 after its last UI usage is gone). `fetchChat(since?: string | null): Promise<ChatMessage[]>`. Admin PATCH stamps `session_started_at` on the false→true transition of `is_live`.

- [ ] **Step 1: Update the `LiveConfig` type in `lib/data.ts`**

Add the import at the top of the file and extend the type:

```ts
import type { ServiceTime } from "@/lib/live-utils";

export type LiveConfig = {
  id: number;
  is_live: boolean;
  title: string;
  subtitle: string;
  viewers: number; // legacy — no longer displayed; removed in a later task
  embed_url: string | null;
  poster_url: string | null;
  session_started_at: string | null;
  youtube_playlist_id: string | null;
  schedule: ServiceTime[] | null;
};
```

- [ ] **Step 2: Make `fetchChat` session-scoped**

Replace the existing `fetchChat` in `lib/data.ts`:

```ts
export async function fetchChat(since?: string | null): Promise<ChatMessage[]> {
  let q = supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(200);
  if (since) q = q.gte("created_at", since);
  const { data } = await q;
  return data ?? [];
}
```

- [ ] **Step 3: Stamp the session in `app/api/admin/live/route.js`**

Replace the PATCH body (keep the `guard()` helper untouched):

```js
// Update the single live_stream_config row (id = 1).
export async function PATCH(req) {
  const blocked = await guard();
  if (blocked) return blocked;
  const fields = await req.json();
  delete fields.id; // never let the id be changed
  fields.updated_at = new Date().toISOString();

  // Going live starts a fresh chat session: stamp the transition moment so
  // the public chat only shows messages from this service onward.
  const { data: current } = await supabaseAdmin
    .from("live_stream_config")
    .select("is_live")
    .eq("id", 1)
    .single();
  if (fields.is_live === true && current && !current.is_live) {
    fields.session_started_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("live_stream_config")
    .update(fields)
    .eq("id", 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 4: Verify compile + behavior**

Start dev server (`kat-dev` config, port 3010). Then verify the stamp end-to-end:
1. Log into `/admin/login` (password `StCatherine#2026`), open Live tab, toggle LIVE **off**, Save; toggle **on**, Save.
2. Run: `node -e "require('dotenv').config({path:'C:/Users/HP/Desktop/KAT/.env.local'});const{Client}=require('pg');(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});await c.connect();const r=await c.query('select is_live, session_started_at from live_stream_config where id=1');console.log(r.rows[0]);await c.end();})()"`
Expected: `is_live: true` and `session_started_at` within the last minute. Toggling on again WITHOUT toggling off must NOT move the stamp (repeat save, re-check).

- [ ] **Step 5: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add lib/data.ts app/api/admin/live/route.js
git -C C:/Users/HP/Desktop/KAT commit -m "feat: session-scoped chat fetch + go-live stamps session_started_at"
```

---

### Task 4: Viewer count route — `/api/live/stats`

**Files:**
- Create: `app/api/live/stats/route.ts`

**Interfaces:**
- Consumes: `extractYouTubeId` (Task 2); `supabaseAdmin` from `@/lib/supabaseAdmin`; env `YOUTUBE_API_KEY`.
- Produces: `GET /api/live/stats` → `{ viewers: number | null }`. Consumed by `useLiveViewers` (Task 6).

- [ ] **Step 1: Create `app/api/live/stats/route.ts`**

```ts
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
```

- [ ] **Step 2: Verify the graceful-degradation path**

With the dev server running (no `YOUTUBE_API_KEY` in `.env.local` yet):
Run: `curl -s http://localhost:3010/api/live/stats`
Expected: `{"viewers":null}` with HTTP 200.

- [ ] **Step 3: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add app/api/live/stats/route.ts
git -C C:/Users/HP/Desktop/KAT commit -m "feat: /api/live/stats — real concurrent viewers from YouTube, cached, graceful without key"
```

---

### Task 5: Archive route — `/api/live/archive`

**Files:**
- Create: `app/api/live/archive/route.ts`

**Interfaces:**
- Consumes: `extractYouTubeId` (Task 2); `supabaseAdmin`; env `YOUTUBE_API_KEY`; `live_stream_config.youtube_playlist_id` (Task 1).
- Produces: `GET /api/live/archive` → `{ items: ArchiveItem[] }` where `ArchiveItem = { videoId: string; title: string; publishedAt: string; thumbnail: string | null }`. Consumed by `useLiveArchive` (Task 6) and the Broadcast page (Task 10).

- [ ] **Step 1: Create `app/api/live/archive/route.ts`**

```ts
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
```

- [ ] **Step 2: Verify graceful degradation**

Run: `curl -s http://localhost:3010/api/live/archive`
Expected: `{"items":[]}` with HTTP 200 (no key configured yet).

- [ ] **Step 3: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add app/api/live/archive/route.ts
git -C C:/Users/HP/Desktop/KAT commit -m "feat: /api/live/archive — past services from YouTube playlist/uploads, cached"
```

---

### Task 6: Realtime hooks — instant LIVE state, viewers, archive

**Files:**
- Create: `lib/use-live.ts`
- Modify: `components/site/shell.tsx:38` (SiteShell live query)
- Modify: `components/admin/admin-shell.tsx` (LiveStatusChip query — find the `useQuery({ queryKey: ["live"] ...})` inside it)

**Interfaces:**
- Consumes: `fetchLive`, `LiveConfig` (lib/data.ts); `supabase` (lib/supabase/client.ts); routes from Tasks 4–5.
- Produces (consumed by Tasks 7, 10, 11):

```ts
export function useLiveConfig(): UseQueryResult<LiveConfig | null>; // realtime-updated ["live"] query
export function useLiveViewers(isLive: boolean | undefined): number | null;
export type ArchiveItem = { videoId: string; title: string; publishedAt: string; thumbnail: string | null };
export function useLiveArchive(): { items: ArchiveItem[]; isLoading: boolean };
```

- [ ] **Step 1: Create `lib/use-live.ts`**

```ts
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
```

- [ ] **Step 2: Wire `SiteShell` to the realtime hook**

In `components/site/shell.tsx`, replace
`const { data: live } = useQuery({ queryKey: ["live"], queryFn: fetchLive });`
with
`const { data: live } = useLiveConfig();`
Add `import { useLiveConfig } from "@/lib/use-live";` and remove the now-unused `useQuery`/`fetchLive` imports if nothing else in the file uses them (`type LiveConfig` import stays).

- [ ] **Step 3: Wire the admin topbar chip**

In `components/admin/admin-shell.tsx`, find the LiveStatusChip's `useQuery({ queryKey: ["live"], queryFn: fetchLive })` and replace it with `useLiveConfig()` (same import). Admin styling untouched.

- [ ] **Step 4: Verify instant flip**

Two browser windows: `/` (home) and `/admin` Live tab. Toggle LIVE and Save in admin.
Expected: the home story-ring/live card flips to LIVE within ~1s **without reloading**. Toggle off → flips back. If it doesn't, check the browser console for a failed websocket (`realtime`) connection and confirm Task 1's publication verification passed.

- [ ] **Step 5: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add lib/use-live.ts components/site/shell.tsx components/admin/admin-shell.tsx
git -C C:/Users/HP/Desktop/KAT commit -m "feat: realtime live-config hook + viewers/archive hooks, wired into site + admin chip"
```

---

### Task 7: Realtime, session-scoped chat

**Files:**
- Modify: `components/site/live-chat.tsx`

**Interfaces:**
- Consumes: `useLiveConfig` (Task 6), `fetchChat(since)` (Task 3), `supabase` client.
- Produces: `LiveChat` behavior — realtime message delivery, fresh room per session. Same component API (`{ dark?: boolean }`) so existing usage in `shell.tsx` + `app/live/page.tsx` keeps working.

- [ ] **Step 1: Rework the chat query + add the realtime subscription**

In `components/site/live-chat.tsx`, inside `LiveChat`:

```tsx
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth, displayName } from "@/components/auth/auth-provider";
import { useLiveConfig } from "@/lib/use-live";
import { fetchChat, postChat, type ChatMessage } from "@/lib/data";

export function LiveChat({ dark = false }: { dark?: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Chat is scoped to the current service: keyed by session_started_at so a
  // new session automatically starts from an empty room.
  const { data: live } = useLiveConfig();
  const since = live?.session_started_at ?? null;
  const chatKey = ["chat", since ?? "all"] as const;

  const chat = useQuery({
    queryKey: chatKey,
    queryFn: () => fetchChat(since),
    refetchInterval: 30_000, // safety net; realtime does the real work
  });

  // Realtime delivery. Dedupe against optimistic entries (temp id = Date.now()).
  useEffect(() => {
    const ch = supabase
      .channel("live-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = payload.new as ChatMessage;
          qc.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
            if (old.some((m) => m.id === row.id)) return old;
            const tempIdx = old.findIndex(
              (m) => m.id > 1e12 && m.name === row.name && m.message === row.message
            );
            if (tempIdx >= 0) {
              const next = [...old];
              next[tempIdx] = row;
              return next;
            }
            return [...old, row];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, since]);
  ...
```

The `send` mutation keeps its optimistic logic but every `["chat"]` cache reference becomes `chatKey`. Drop the `onSettled` invalidation (realtime replaces the temp row; invalidating would refetch needlessly) — keep `onError` rollback. The rest of the component (scroll effect, submit handler, JSX) is unchanged.

- [ ] **Step 2: Verify realtime + session reset**

1. Two browser windows on `/live`. Send a message in window A → appears in window B within ~1s without waiting for a 30s poll.
2. In admin: toggle LIVE off, Save; toggle on, Save. Reload `/live` in both windows → chat is empty (fresh session). Old messages still exist in the DB (`select count(*) from chat_messages` unchanged).

- [ ] **Step 3: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add components/site/live-chat.tsx
git -C C:/Users/HP/Desktop/KAT commit -m "feat: realtime chat with per-service sessions (fresh room on go-live)"
```

---

### Task 8: Admin Live tab — schedule editor + playlist field

**Files:**
- Modify: `app/admin/(protected)/live/page.tsx`

**Interfaces:**
- Consumes: `ServiceTime` (Task 2), existing PATCH `/api/admin/live` (accepts arbitrary column fields — `schedule` and `youtube_playlist_id` pass straight through).
- Produces: admin can edit weekly schedule + playlist id. Data lands in the columns Task 1 created.

- [ ] **Step 1: Extend the form state and payload**

In `app/admin/(protected)/live/page.tsx`: import `type ServiceTime` from `@/lib/live-utils`. Extend the empty-form default and the save payload:

```tsx
const f = form ?? cfg ?? { is_live: false, title: "", subtitle: "", embed_url: "", poster_url: "", youtube_playlist_id: "", schedule: [] };
```

and in `save()` add to the PATCH body: `youtube_playlist_id: f.youtube_playlist_id || null, schedule: f.schedule ?? []`.

- [ ] **Step 2: Add the schedule editor + playlist field to the form JSX**

Insert after the poster uploader `<div>` (before `{msg && ...}`), using the existing `inputCls`/`label` constants so it matches admin styling:

```tsx
<div>
  <label className={label}>YouTube playlist ID (optional)</label>
  <input className={inputCls} value={f.youtube_playlist_id ?? ""} onChange={(e) => set({ youtube_playlist_id: e.target.value })} placeholder="PLxxxxxxxxxxxxxxxx" />
  <p className="mt-1.5 text-[11.5px] text-muted-foreground">If set, "Previous services" shows this playlist (e.g. a Sunday Mass playlist). Otherwise the channel&rsquo;s uploads are used.</p>
</div>

<div>
  <label className={label}>Weekly service schedule</label>
  <p className="mb-2 text-[11.5px] text-muted-foreground">Shown on the Live page with a countdown when you&rsquo;re offline.</p>
  <div className="space-y-2">
    {(f.schedule ?? []).map((s: ServiceTime, i: number) => (
      <div key={i} className="flex gap-2">
        <select className={`${inputCls} w-28 flex-none`} value={s.day}
          onChange={(e) => set({ schedule: (f.schedule ?? []).map((x: ServiceTime, j: number) => j === i ? { ...x, day: Number(e.target.value) } : x) })}>
          {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d, di) => <option key={d} value={di}>{d}</option>)}
        </select>
        <input type="time" className={`${inputCls} w-28 flex-none`} value={s.time}
          onChange={(e) => set({ schedule: (f.schedule ?? []).map((x: ServiceTime, j: number) => j === i ? { ...x, time: e.target.value } : x) })} />
        <input className={inputCls} value={s.label} placeholder="Holy Mass"
          onChange={(e) => set({ schedule: (f.schedule ?? []).map((x: ServiceTime, j: number) => j === i ? { ...x, label: e.target.value } : x) })} />
        <button type="button" aria-label="Remove"
          onClick={() => set({ schedule: (f.schedule ?? []).filter((_: ServiceTime, j: number) => j !== i) })}
          className="flex-none px-2 text-sm text-red-500 hover:text-red-600">✕</button>
      </div>
    ))}
  </div>
  <button type="button"
    onClick={() => set({ schedule: [...(f.schedule ?? []), { day: 0, time: "09:00", label: "Holy Mass" }] })}
    className="mt-2 text-[12.5px] font-semibold text-emerald-600 hover:text-emerald-700">+ Add service time</button>
</div>
```

Also add one helper line under the LIVE toggle's existing hint (`Turn on when the service starts...`): change that `<p>` text to `Turn on when the service starts — the LIVE badge appears everywhere instantly and a fresh chat session begins.`

- [ ] **Step 3: Verify end-to-end**

In admin Live tab: add two schedule rows (Sunday 09:00 Holy Mass, Friday 18:30 Adoration), set a playlist id of `TEST`, Save. Reload the page → rows and playlist persist. Then clear playlist to empty, Save, reload → stays empty (stored as null).

- [ ] **Step 4: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add "app/admin/(protected)/live/page.tsx"
git -C C:/Users/HP/Desktop/KAT commit -m "feat(admin): weekly schedule editor + youtube playlist field on Live tab"
```

---

### Task 9: CSS foundation + motion primitives for the bold pass

**Files:**
- Modify: `app/globals.css` (append inside `@layer utilities`)
- Modify: `app/providers.tsx` (MotionConfig)
- Create: `components/site/motion.tsx`

**Interfaces:**
- Produces CSS utilities consumed by Tasks 10–12: `.app-wash`, `.ambient-stage`, `.ambient-warm`, `.gradient-frame`, `.gradient-frame-live`, `.story-ring`, `.zoom-media`. React: `FadeUp` component; `MotionConfig reducedMotion="user"` app-wide.

- [ ] **Step 1: Append utilities to `app/globals.css`** (inside the existing `@layer utilities` block, after `.live-chip`)

```css
  /* ---- 2026 bold pass ---- */

  /* Faint brand-gradient wash so the app background never reads flat. */
  .app-wash {
    background:
      radial-gradient(55% 38% at 10% 0%, hsl(var(--primary) / 0.06), transparent 70%),
      radial-gradient(45% 32% at 90% 6%, hsl(var(--gold) / 0.05), transparent 70%),
      hsl(var(--background));
  }

  /* Ambient stage: blurred colored light behind a hero element (pure CSS). */
  .ambient-stage { position: relative; isolation: isolate; }
  .ambient-stage::before {
    content: ""; position: absolute; inset: -12% -18%; z-index: -1; pointer-events: none;
    background:
      radial-gradient(42% 55% at 22% 18%, hsl(var(--primary) / 0.32), transparent 70%),
      radial-gradient(38% 48% at 78% 30%, hsl(var(--gold) / 0.16), transparent 70%),
      radial-gradient(50% 60% at 55% 92%, hsl(var(--primary-deep) / 0.22), transparent 72%);
    filter: blur(48px);
  }
  /* Warm variant (prayer wall): candle-light instead of broadcast blue. */
  .ambient-warm { position: relative; isolation: isolate; }
  .ambient-warm::before {
    content: ""; position: absolute; inset: -12% -18%; z-index: -1; pointer-events: none;
    background:
      radial-gradient(45% 55% at 30% 20%, hsl(var(--gold) / 0.22), transparent 70%),
      radial-gradient(40% 50% at 75% 70%, hsl(28 70% 55% / 0.12), transparent 70%);
    filter: blur(42px);
  }

  /* Animated gradient frame — wrap an element, give the wrapper p-[2px].
     -live variant runs hotter (destructive red joins the sweep). */
  @keyframes gradient-drift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .gradient-frame {
    padding: 2px;
    background: linear-gradient(120deg, hsl(var(--primary)), hsl(var(--gold)), hsl(var(--primary-deep)), hsl(var(--primary)));
    background-size: 300% 300%;
    animation: gradient-drift 7s ease-in-out infinite;
  }
  .gradient-frame-live {
    background: linear-gradient(120deg, hsl(var(--destructive)), hsl(var(--gold)), hsl(var(--primary)), hsl(var(--destructive)));
    background-size: 300% 300%;
    animation: gradient-drift 5s ease-in-out infinite;
  }

  /* Instagram-style conic ring for the story row. */
  .story-ring {
    background: conic-gradient(from 210deg, hsl(var(--primary)), hsl(var(--gold)), hsl(var(--primary-deep)), hsl(var(--primary)));
  }

  /* Media hover-zoom (gallery, store). Pair with overflow-hidden on the parent. */
  .zoom-media img { transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
  .zoom-media:hover img { transform: scale(1.05); }
```

- [ ] **Step 2: `components/site/motion.tsx`**

```tsx
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/* Standard entrance for feed items and page sections. Honors reduced motion
   via the app-level MotionConfig. Cap stagger delays at ~0.3s. */
export function FadeUp({ delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    />
  );
}
```

- [ ] **Step 3: MotionConfig in `app/providers.tsx`**

Read the file; wrap the existing provider children with `<MotionConfig reducedMotion="user">…</MotionConfig>` (import `MotionConfig` from `framer-motion`), placed just inside the outermost provider so every motion component inherits it.

- [ ] **Step 4: Apply the wash + verify compile**

In `components/site/shell.tsx` change `<div className="min-h-[100dvh]">` (SiteShell root) to `<div className="app-wash min-h-[100dvh]">`.
Then: dev server compiles all routes 200, and `curl -s http://localhost:3010/ | Select-String app-wash` finds the class. Visually (browser): home background has a barely-visible blue tint at the top corners in light mode; check dark mode too (toggle in Settings).

- [ ] **Step 5: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add app/globals.css app/providers.tsx components/site/motion.tsx components/site/shell.tsx
git -C C:/Users/HP/Desktop/KAT commit -m "feat(ui): bold-pass CSS foundation (wash, ambient, gradient frames, story ring, zoom) + motion primitives"
```

---

### Task 10: The Broadcast live page

**Files:**
- Create: `components/site/broadcast.tsx`
- Rewrite: `app/live/page.tsx`

**Interfaces:**
- Consumes: `useLiveConfig`, `useLiveViewers`, `useLiveArchive`, `ArchiveItem` (Task 6); `nextServiceOccurrence`, `formatCountdown`, `ServiceTime` (Task 2); `LiveChat` (Task 7); CSS utilities (Task 9).
- Produces: `CountdownHero`, `ScheduleRows`, `ArchiveGrid`, `ViewerChip`, `useCountdown` — also consumed by Task 11 (home live card countdown chip).

- [ ] **Step 1: Create `components/site/broadcast.tsx`**

```tsx
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
```

- [ ] **Step 2: Rewrite `app/live/page.tsx`** (full replacement)

```tsx
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
  const showPlayer = !!embedSrc && (replayId || live?.is_live);

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

            <div className="mt-2 border border-white/10 bg-white/[0.03]">
              <ArchiveGrid items={archive.items} onPlay={setReplayId} />
            </div>
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
            <p className="mt-2 text-center text-xs text-slate-500">Be gracious to one another.</p>
          </FadeUp>
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  return <SiteShell><Content /></SiteShell>;
}
```

- [ ] **Step 3: Verify**

- `/live` renders dark in BOTH themes (toggle theme in Settings, revisit — page stays dark; the rest of the site follows the theme).
- Offline (`is_live` false, schedule set in Task 8): countdown hero ticks every second; schedule rows show; archive section hidden (no key yet) without an empty gap.
- Live (`is_live` true): breathing `gradient-frame-live` around the player; LIVE chip; chat rail sits beside the player at ≥1024px wide and below it on mobile (resize_window mobile preset).
- No console errors; all other routes still 200.

- [ ] **Step 4: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add components/site/broadcast.tsx app/live/page.tsx
git -C C:/Users/HP/Desktop/KAT commit -m "feat(ui): Broadcast live page — dark room, chat rail, countdown hero, schedule, archive"
```

---

### Task 11: Home live-card hero, story rings, feed entrances, WatchView alignment + drop legacy `viewers`

**Files:**
- Modify: `components/site/feed.tsx` (StoryRow, LiveCard, RightSidebar, HomeFeed)
- Modify: `components/site/shell.tsx` (WatchView)
- Modify: `lib/data.ts` (remove `viewers` from LiveConfig)

**Interfaces:**
- Consumes: `useLiveViewers`, `useCountdown`, `ViewerChip` (Tasks 6, 10); `FadeUp` (Task 9); CSS utilities (Task 9).
- Produces: no `live.viewers` reads remain anywhere (verified by grep + compile).

- [ ] **Step 1: StoryRow — gradient rings**

In `StoryRow` (feed.tsx), change the shortcut ring container from
`"mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-soft ring-1 ring-inset ring-primary/15"`
to
`"story-ring mx-auto grid h-16 w-16 place-items-center rounded-full p-[2.5px]"`
and wrap the icon in an inner disc:

```tsx
<span className="story-ring mx-auto grid h-16 w-16 place-items-center rounded-full p-[2.5px]">
  <span className="grid h-full w-full place-items-center rounded-full border-[3px] border-background bg-primary-soft">
    <span className="h-7 w-7 bg-primary-deep" style={maskStyle(s.icon)} aria-hidden />
  </span>
</span>
```

(The Watch bubble already has its live ring — leave it.)

- [ ] **Step 2: LiveCard — gradient-frame hero + countdown chip + real viewers**

Replace `LiveCard` in feed.tsx:

```tsx
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
```

Add imports to feed.tsx: `import { useLiveViewers } from "@/lib/use-live";`, `import { useCountdown } from "@/components/site/broadcast";`, `import { FadeUp } from "@/components/site/motion";`.

- [ ] **Step 3: RightSidebar — same treatment for the desktop live card**

In `RightSidebar`, add `const viewers = useLiveViewers(live?.is_live);` and replace the badge's `` `LIVE${!!live?.viewers && ` · ${live.viewers}`}` `` with `` `LIVE${viewers != null && viewers > 0 ? ` · ${viewers}` : ""}` `` — show the chip only when `live?.is_live` (wrap it in `{live?.is_live && ...}`). Wrap the live-card `card-surface` div in `{live?.is_live ? <div className="gradient-frame-live">…</div> : …}` the same way as LiveCard (frame only when live).

- [ ] **Step 4: HomeFeed — staggered entrances**

In `HomeFeed`, wrap each feed child in `FadeUp` with capped delays:

```tsx
<div className="space-y-4">
  {announcements.data?.slice(0, 2).map((a, i) => <FadeUp key={a.id} delay={Math.min(i * 0.06, 0.3)}><AnnouncementPost item={a} /></FadeUp>)}
  {prayers.data?.[0] && <FadeUp delay={0.12}><PrayerPost item={prayers.data[0]} /></FadeUp>}
  {announcements.data?.slice(2, 3).map((a) => <FadeUp key={a.id} delay={0.18}><AnnouncementPost item={a} /></FadeUp>)}
  {prayers.data?.slice(1, 3).map((p, i) => <FadeUp key={p.id} delay={Math.min(0.24 + i * 0.06, 0.3)}><PrayerPost item={p} /></FadeUp>)}
</div>
```

- [ ] **Step 5: WatchView — align with Broadcast + real viewers**

In `shell.tsx` `WatchView`: add `const viewers = useLiveViewers(live?.is_live);` (import from `@/lib/use-live`). Replace the subtitle line `{live?.viewers ? `Live · ${live.viewers} watching` : "Live now"}` with `{live?.is_live ? (viewers != null && viewers > 0 ? `Live · ${viewers} watching` : "Live now") : "Offline"}`. Change the backdrop `bg-[#0b0f13]` to `bg-[#080e15]` (same room color as the live page) and show the LIVE chip only when `live?.is_live`.

- [ ] **Step 6: Remove `viewers` from `LiveConfig` and sweep**

Delete the `viewers: number;` line from `LiveConfig` in lib/data.ts.
Run: `Select-String -Path C:\Users\HP\Desktop\KAT\app\**\*.tsx,C:\Users\HP\Desktop\KAT\components\**\*.tsx -Pattern "\.viewers"` (or grep) — the only hits must be `useLiveViewers`/local `viewers` variables, no `live.viewers`/`live?.viewers`. Dev server must compile every route 200 (TS would fail the page on any leftover).

- [ ] **Step 7: Verify visually**

Home (mobile width): story icons have gradient rings; live card shows countdown chip when offline / animated red-gold frame + LIVE chip when live (toggle in admin — should flip in-place within ~1s thanks to Task 6); posts fade up on first load. Desktop: sidebar card framed when live. WatchView opens dark with correct status line. No console errors, both themes.

- [ ] **Step 8: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add components/site/feed.tsx components/site/shell.tsx lib/data.ts
git -C C:/Users/HP/Desktop/KAT commit -m "feat(ui): live-card hero + story rings + feed entrances + WatchView alignment; drop legacy viewers field"
```

---

### Task 12: Per-page bold moments (donate, prayer, events, gallery, store, login, settings, announcements)

**Files:**
- Modify: `app/donate/page.tsx`, `app/prayer/page.tsx`, `app/events/page.tsx`, `app/gallery/page.tsx`, `app/store/page.tsx`, `app/login/page.tsx`, `app/settings/page.tsx`, `app/announcements/page.tsx`

**Interfaces:**
- Consumes: CSS utilities (Task 9), `FadeUp` (Task 9). No new interfaces produced.

Read each page before editing (they're each small). Apply exactly one "moment" per page plus the shared consistency rules; do not restructure page logic.

**Shared consistency rules (all 8 pages):**
1. Page `<h1>` becomes `text-2xl font-semibold tracking-tight` (add `tracking-tight` where missing).
2. Wrap the page's main content block in `<FadeUp>` (single wrapper, no per-item stagger except where noted).
3. Any empty-data state must render a friendly empty message (if a page would render nothing, add `<p className="py-10 text-center text-sm text-muted-foreground">…</p>` with page-appropriate copy).

**Per-page moments:**

- [ ] **Step 1: Donate** — wrap the amount/fund panel (the main giving card) in a parent `<div className="ambient-stage">`; on the selected preset amount button add `glow-gold ring-1 ring-gold scale-[1.03]` (keep existing selected styles, add `transition-transform`); confirm the main Give button already has `glow-gold` (add if missing).
- [ ] **Step 2: Prayer** — wrap the compose card in `<div className="ambient-warm">`; leave the pixel-candle system untouched.
- [ ] **Step 3: Events** — each event's date block (the square with day/month, similar to RightSidebar's) becomes `bg-gradient-to-br from-primary to-primary-deep text-white` (replacing its `bg-primary-soft text-primary-deep`); keep `.num` and sizing.
- [ ] **Step 4: Gallery** — add `zoom-media` to each photo tile's container (must already/also have `overflow-hidden`); add a caption overlay `<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-ink/80 to-transparent px-3 pb-2 pt-8 text-[12px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">` (tile gets `group relative`) showing the photo caption when present.
- [ ] **Step 5: Store** — product image container gets `zoom-media overflow-hidden`; card keeps/gains `card-surface card-surface-interactive`; price gets `num font-semibold text-gold`.
- [ ] **Step 6: Login** — wrap the auth card in `<div className="ambient-stage">` and give the card `glass-strong border border-border` (replacing a plain `bg-card`/`card-surface` if present).
- [ ] **Step 7: Settings** — each settings section card gets `card-surface` (if not already); the page content wrapped in FadeUp; no other changes.
- [ ] **Step 8: Announcements** — list items get per-item stagger: `{items.map((a, i) => <FadeUp key={a.id} delay={Math.min(i * 0.05, 0.3)}><AnnouncementPost item={a} /></FadeUp>)}` (reuse the existing `AnnouncementPost` import pattern).

- [ ] **Step 9: Verify**

Every page: renders 200, no console errors, both themes, mobile + desktop widths. Specifically: donate glow visible behind panel; prayer compose has warm halo; event date blocks gradient; gallery/store zoom on hover; login panel glassy.

- [ ] **Step 10: Commit**

```bash
git -C C:/Users/HP/Desktop/KAT add app/donate/page.tsx app/prayer/page.tsx app/events/page.tsx app/gallery/page.tsx app/store/page.tsx app/login/page.tsx app/settings/page.tsx app/announcements/page.tsx
git -C C:/Users/HP/Desktop/KAT commit -m "feat(ui): per-page bold moments — ambient stages, gradient date blocks, hover zoom, glass auth"
```

---

### Task 13: Full verification sweep + production build

**Files:** none created (fixes only if issues found).

- [ ] **Step 1: Route sweep** — with the dev server running:

```powershell
$routes = "/","/live","/prayer","/announcements","/events","/store","/gallery","/donate","/settings","/login","/api/live/stats","/api/live/archive"
foreach ($r in $routes) { $c = (Invoke-WebRequest -UseBasicParsing "http://localhost:3010$r" -SkipHttpErrorCheck).StatusCode; Write-Output "$c $r" }
```

Expected: `200` for every route.

- [ ] **Step 2: Behavior checks** (browser):
  - Admin login → Live tab: toggle LIVE on/off round-trip; schedule + playlist fields persist.
  - Instant flip: home page in a second window updates LIVE badge within ~1s of admin save, no reload.
  - Chat: two windows, message crosses in ~1s; after off→on toggle chat room is fresh.
  - Countdown ticks per second on offline `/live`.
  - Admin visual: dashboard/announcements/events unchanged (spot-check).
  - Both themes on `/`, `/live`, `/donate`, `/prayer`; mobile preset on `/` and `/live`.
  - `read_console_messages onlyErrors` clean on every visited page.

- [ ] **Step 3: Unit tests still pass**

Run: `node --test C:\Users\HP\Desktop\KAT\scripts\live-utils.test.mjs`
Expected: `# fail 0`

- [ ] **Step 4: Production build**

Run: `npm --prefix C:\Users\HP\Desktop\KAT run build`
Expected: build completes with no type errors. Also confirm the YouTube key never leaks: `Select-String -Path C:\Users\HP\Desktop\KAT\.next\static\**\*.js -Pattern "YOUTUBE_API_KEY|googleapis.com/youtube" -List` → no matches in client bundles.

- [ ] **Step 5: Commit any fixes**

```bash
git -C C:/Users/HP/Desktop/KAT add -A
git -C C:/Users/HP/Desktop/KAT commit -m "fix: verification sweep fixes"   # only if fixes were needed
```

---

### Task 14: Deploy to Vercel + handoff

- [ ] **Step 1: Confirm with the user before touching `main`** — show them a summary of what's about to deploy. Do not merge/push without a yes in chat.

- [ ] **Step 2: Merge + push**

```bash
git -C C:/Users/HP/Desktop/KAT checkout main
git -C C:/Users/HP/Desktop/KAT merge --no-ff live-session-2026 -m "Live session completion + full bold 2026 visual pass"
git -C C:/Users/HP/Desktop/KAT push origin main
```

- [ ] **Step 3: Give the user the YOUTUBE_API_KEY steps** (viewer count + archive stay gracefully hidden until done):
  1. console.cloud.google.com → create/select a project → "APIs & Services" → "Library" → enable **YouTube Data API v3**.
  2. "APIs & Services" → "Credentials" → "Create credentials" → **API key** (optionally restrict it to the YouTube Data API).
  3. Vercel dashboard → KAT project → Settings → Environment Variables → add `YOUTUBE_API_KEY` = the key (Production + Preview) → redeploy.
  4. Locally: add `YOUTUBE_API_KEY="<key>"` to `C:\Users\HP\Desktop\KAT\.env.local`.

- [ ] **Step 4: Verify production** — after Vercel finishes: production URL loads, `/live` shows the Broadcast room, `/api/live/stats` returns 200 JSON. With the key set and a live video configured, verify a real viewer number appears and the archive grid populates.

- [ ] **Step 5: Update the vault note** — `C:\Users\HP\Documents\SecondBrain\1-Projects\Church Platform.md`: mark live-session build complete, note the YouTube key step if still pending, refresh Next actions.

---

## Self-Review (done at planning time)

- **Spec coverage:** viewer count (T4,T6,T10,T11) ✓; fresh chat per service (T1,T3,T7) ✓; instant LIVE (T1,T6) ✓; realtime chat (T1,T7) ✓; archive (T5,T6,T10) ✓; offline schedule/countdown (T1,T2,T8,T10) ✓; admin Live additions (T8) ✓; Broadcast page + chat rail (T10) ✓; home hero/story rings/entrances (T11) ✓; per-page moments (T12) ✓; guardrails (T9 reduced-motion, CSS-only) ✓; verification + deploy + vault (T13,T14) ✓.
- **Type consistency:** `ServiceTime`/`extractYouTubeId`/`nextServiceOccurrence`/`formatCountdown` defined T2, consumed T3/T4/T5/T8/T10 with matching signatures; `ArchiveItem` shape identical in T5 route and T6 hook; `useLiveConfig`/`useLiveViewers`/`useLiveArchive` consumed in T7/T10/T11 as defined in T6; `fetchChat(since)` (T3) matches T7 usage. `viewers` removal deferred to T11 so every intermediate task compiles.
- **Placeholders:** none — every code step has complete code; T12 gives exact class recipes against named elements with a read-first instruction.
