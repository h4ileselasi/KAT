-- St. Catherine Church Platform — Database Schema
-- Fully idempotent: safe to run any number of times.
-- Applied automatically by: node scripts/migrate.js

-- ============================================================
-- PRAYER WALL
-- ============================================================
CREATE TABLE IF NOT EXISTS prayer_wall (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  intention TEXT NOT NULL,
  name TEXT DEFAULT 'Anonymous',
  device_ip INET, -- rate-limit per device (not stored permanently)
  candles INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prayer_created ON prayer_wall(created_at DESC);

ALTER TABLE prayer_wall ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view prayers" ON prayer_wall;
DROP POLICY IF EXISTS "Anyone can add a prayer" ON prayer_wall;
DROP POLICY IF EXISTS "Anyone can light candles" ON prayer_wall;
CREATE POLICY "Anyone can view prayers" ON prayer_wall FOR SELECT USING (true);
CREATE POLICY "Anyone can add a prayer" ON prayer_wall FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can light candles" ON prayer_wall FOR UPDATE USING (true);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created ON announcements(pinned DESC, created_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read announcements" ON announcements;
CREATE POLICY "Anyone can read announcements" ON announcements FOR SELECT USING (true);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  day TEXT NOT NULL,   -- "Fri", "Sat", etc.
  date TEXT NOT NULL,  -- "Jul 4", "Jul 12"
  time TEXT NOT NULL,  -- "5:00 PM"
  location TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read events" ON events;
CREATE POLICY "Anyone can read events" ON events FOR SELECT USING (true);

-- ============================================================
-- PRODUCTS (Store)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  price INT NOT NULL,  -- GHS whole cedis (e.g., 45 = GHS 45)
  image_url TEXT,
  tag TEXT,            -- "Bestseller", "New", etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read products" ON products;
CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);

-- ============================================================
-- LIVE STREAM CONFIG (single row, admin-managed)
-- ============================================================
CREATE TABLE IF NOT EXISTS live_stream_config (
  id BIGINT PRIMARY KEY,
  is_live BOOLEAN DEFAULT FALSE,
  title TEXT DEFAULT 'Sunday Holy Mass — 9:00 AM',
  subtitle TEXT DEFAULT 'Celebrant: Fr. Emmanuel Okoye',
  viewers INT DEFAULT 0,
  embed_url TEXT,
  poster_url TEXT,
  next_service_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed the single config row (id = 1) only if it doesn't exist yet.
INSERT INTO live_stream_config (id, poster_url)
VALUES (1, 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=900&q=70&auto=format&fit=crop')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE live_stream_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read live config" ON live_stream_config;
CREATE POLICY "Anyone can read live config" ON live_stream_config FOR SELECT USING (true);

-- ============================================================
-- DONATIONS (recorded after Paystack verifies a payment)
-- ============================================================
CREATE TABLE IF NOT EXISTS donations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reference TEXT UNIQUE NOT NULL,
  email TEXT,
  amount INT NOT NULL,        -- whole GHS cedis
  fund TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at DESC);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
-- No public policies: only the service role (server) reads/writes donations.

-- ============================================================
-- ANNOUNCEMENT CANDLES (shared count, lit by anyone incl. guests)
-- ============================================================
-- Add the column to existing tables without dropping data.
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS candles INT DEFAULT 0;

-- ============================================================
-- CANDLE INCREMENT (atomic, avoids race conditions)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_candles(prayer_id BIGINT)
RETURNS void AS $$
  UPDATE prayer_wall SET candles = candles + 1 WHERE id = prayer_id;
$$ LANGUAGE sql;

-- Announcements are admin-managed (public has SELECT only, no UPDATE policy),
-- so lighting a candle can't be a direct client UPDATE. This SECURITY DEFINER
-- function runs with owner privileges and touches ONLY the candles column, so
-- any visitor (guest or signed-in) can increment the shared count without
-- being able to edit announcement content. search_path is pinned for safety.
CREATE OR REPLACE FUNCTION increment_announcement_candles(announcement_id BIGINT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE announcements SET candles = candles + 1 WHERE id = announcement_id;
$$;

GRANT EXECUTE ON FUNCTION increment_announcement_candles(BIGINT) TO anon, authenticated;

-- ============================================================
-- LIVE CHAT (messages during the service)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT DEFAULT 'Guest',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read chat" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can post chat" ON chat_messages;
CREATE POLICY "Anyone can read chat" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can post chat" ON chat_messages FOR INSERT WITH CHECK (true);

-- ============================================================
-- GALLERY (real parish photos, managed in admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_created ON gallery(created_at DESC);

ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read gallery" ON gallery;
CREATE POLICY "Anyone can read gallery" ON gallery FOR SELECT USING (true);
-- Admin writes via the service role (bypasses RLS).

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
