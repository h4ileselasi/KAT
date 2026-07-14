# Live Session Completion + Full Bold 2026 Visual Pass — Design Spec

**Date:** 2026-07-14
**Project:** St. Catherine of Siena Catholic Church platform (KAT)
**Approved by:** user, in brainstorming session (architecture: hybrid YouTube-native; visual direction: Full bold 2026)

## Goal

Two deliverables, shipped together and deployed to Vercel:

1. **Complete the live stream session build** — real viewer count, fresh chat per service, instant LIVE state without reload, realtime chat, offline schedule/countdown experience, and a past-services archive.
2. **Full bold 2026 visual pass** over the entire public site (admin untouched) — gradients, glass, ambient glow, and motion layered onto the existing brand. The live experience is the flagship and gets a dark "Broadcast" treatment.

## Non-negotiable brand constraints

- Marian blue `#2b7cc0` / deep `#175488` / ink `#0f3c62`, gold `#c19a3e`; Poppins.
- Sharp-cornered cards/containers (~0–3px radius) paired with pill/rounded controls — unchanged.
- Light AND dark themes both fully supported (except the live page, which is deliberately dark-cinematic in both themes).
- Admin (Mission Control, green) is NOT touched visually. Admin Live page gains new fields only, styled to match existing admin patterns.

---

## Part 1 — Live session build (hybrid YouTube-native)

Architecture decision: **no session tables.** YouTube supplies viewer count and the archive via the YouTube Data API v3; the existing on-site guest chat stays and is upgraded to realtime. The single-row `live_stream_config` remains the source of truth for live state.

### Database changes (migration via existing `scripts/migrate.js` + `supabase/schema.sql`)

- `live_stream_config` gains three columns:
  - `session_started_at timestamptz` — stamped every time the admin toggles LIVE **on**. Defines the current chat session window.
  - `youtube_playlist_id text` — optional; when set, the archive reads this playlist instead of channel uploads.
  - `schedule jsonb` — array of `{ day: 0–6, time: "HH:MM", label: string }` for the weekly service schedule.
- `chat_messages` added to the `supabase_realtime` publication (realtime INSERT events).
- No destructive changes; all idempotent (`ADD COLUMN IF NOT EXISTS`).

### Viewer count — real, from YouTube

- Admin already pastes the embed URL; extract the video ID from it (handles `youtube.com/embed/<id>`, `watch?v=<id>`, `youtu.be/<id>`, `live/<id>` forms).
- New route `app/api/live/stats/route.ts` (server only): calls `videos.list?part=liveStreamingDetails&id=<videoId>` with `YOUTUBE_API_KEY`, returns `{ viewers: number | null }`. Server-side cache ~45s (module-level or `revalidate`) so client polling never multiplies quota usage (videos.list = 1 quota unit; free daily quota 10,000).
- Live page + home live card poll this route via React Query (`refetchInterval` ~45s) **only while `is_live`**.
- The legacy `viewers` column in `live_stream_config` is no longer read; admin never types a viewer count.
- Failure mode: no key configured, quota exhausted, or video not live → `viewers: null` → UI simply shows "LIVE" with no number (current behavior when 0).

### Instant LIVE state

- `lib/` gains a small realtime hook (`useLiveConfig`): subscribes to Supabase Realtime `postgres_changes` (UPDATE on `live_stream_config` id=1) and updates the React Query `["live"]` cache instantly.
- Fallback: keep a slow `refetchInterval` (~60s) on the `["live"]` query in case the websocket drops.
- Consumers: home live card, live page, WatchView, admin topbar LiveStatusChip.

### Fresh chat per service + realtime chat

- `app/api/admin/live/route.ts` (existing PATCH): when `is_live` transitions false→true, also set `session_started_at = now()`.
- `fetchChat` filters `created_at >= session_started_at` (falls back to last-50 behavior if the stamp is null). Old messages are never deleted — they age out of view naturally.
- `LiveChat` subscribes to realtime INSERTs on `chat_messages` and appends to the `["chat"]` cache; polling drops from 4s to a 30s safety net. Optimistic send unchanged. De-dupe by id when the realtime event races the optimistic insert (replace optimistic entry when a real row with matching name+message arrives, standard cache reconciliation).

### Past services archive

- New route `app/api/live/archive/route.ts` (server only): if `youtube_playlist_id` set → `playlistItems.list` (1 unit); else resolve the channel's uploads playlist from the current/last video's channel and list that. Returns `[{ videoId, title, publishedAt, thumbnail }]`, capped at 12. Server-cached ~1 hour.
- Live page renders a "Previous services" thumbnail grid (offline state: prominent; live state: below the chat/player area). Clicking a past service plays it in the on-page player (swap iframe src) — stays on-site, on-brand.
- Failure mode: no key / no results → section hidden entirely.

### Offline experience (live page when `is_live = false`)

- Countdown hero: computes next occurrence from `schedule` (client-side, device timezone — congregation and church are both in Ghana) and renders "SUNDAY HOLY MASS — begins in 2d 14h 03m" with live-ticking tabular numerals.
- Weekly schedule list rendered as elegant rows.
- Past-services archive grid beneath.
- If `schedule` is empty → skip countdown, show poster + archive (no broken/empty hero).

### Admin Live tab additions (existing page, existing visual style)

- Schedule editor: list of rows (day dropdown, time input, label input, remove button) + "Add service time" — writes the `schedule` JSON via the existing PATCH route.
- "YouTube playlist ID (optional)" text field with helper text.
- Toggle behavior note shown under the LIVE switch: "Turning this on starts a fresh chat session."

### User-side prerequisites (documented in spec, done by user once)

- Create a YouTube Data API v3 key in Google Cloud Console (free) → add as `YOUTUBE_API_KEY` to `.env.local` and Vercel project env vars. Claude will provide click-by-click steps at handoff.
- Everything degrades gracefully until the key exists (no viewer number, no archive section).

---

## Part 2 — Full bold 2026 visual pass (public site only)

Principle: brand bones unchanged; boldness comes from **light, glass, gradient, motion**. Ambient effects are pure CSS (gradients/blur — no image assets). Perpetual animation is reserved for LIVE elements only. All motion respects `prefers-reduced-motion`. Light + dark both styled.

### Live experience — "Broadcast" treatment (flagship)

- Live page becomes dark-cinematic in both themes (deep ink backdrop).
- **Desktop layout change:** player left, sticky chat rail right (chat currently sits below the player). Mobile keeps stacked layout; WatchView overlay aligned to the same dark language.
- Ambient blurred Marian-blue + gold radial glows behind the player; when LIVE, a slow-breathing gradient ring around the player.
- Pulsing LIVE chip + viewer count in tabular numerals; glass pill controls; gold glowing Give CTA.
- Offline: countdown hero over ambient glow, schedule rows, archive grid with hover-lift.

### Home feed

- Live card hero: animated blue→gold gradient border + ambient glow + pulsing chip + viewer count when live; next-service countdown chip when offline.
- Story-row shortcuts: Instagram-style gradient rings around the circular icons.
- Feed entrance: framer-motion staggered fade-up on first mount (once, not on every scroll).
- Subtle brand-gradient wash on the app backdrop (both themes).

### Per-page bold moments

- **Donate:** gold ambient glow on the give panel; animated preset selection state.
- **Prayer wall:** warm candle-light ambience around the compose box; existing pixel-candle animation kept.
- **Events:** gradient-accented date blocks.
- **Gallery:** hover zoom + gradient caption overlay.
- **Store:** card hover-lift.
- **Login / Settings:** glass panels.
- **Site-wide:** consistent page-entrance transitions, real empty states, skeletons on all loading states, tightened type hierarchy (bigger display weights on page titles), `.num` on all counts/countdowns.

### Performance guardrails

- CSS-only ambience; framer-motion limited to entrance/interaction; no new image assets for effects; verify no console errors and no obvious jank on every page after the pass; live-page iframe unchanged (YouTube embed).

---

## Verification & delivery

1. Build locally on the dev server; verify each page desktop + mobile, light + dark (screenshots where the preview pane cooperates; DOM/CSS checks otherwise).
2. All existing routes must still return 200; admin flows (login, live config save, uploads) re-verified.
3. Chat: two-window test (message sent in one appears in the other within ~1s); toggle LIVE off/on in admin → chat resets fresh; LIVE badge appears without reload.
4. Viewer count + archive verified live once `YOUTUBE_API_KEY` exists; graceful-degradation paths verified without it.
5. Commit → push to GitHub (`h4ileselasi/KAT`) → Vercel auto-deploy → verify production.
6. Update the Second Brain vault note (`1-Projects/Church Platform.md`) status.

## Out of scope

- Admin visual changes (beyond the new Live-tab fields).
- Paystack live keys / webhook (user-side, already tracked in vault).
- Push notifications when going live (possible future enhancement).
- Supabase session tables / presence (superseded by hybrid decision).
