import { supabase } from "@/lib/supabase/client";
import type { ServiceTime } from "@/lib/live-utils";

export type Announcement = {
  id: number;
  title: string;
  body: string;
  image_url: string | null;
  pinned: boolean;
  candles: number;
  created_at: string;
};

export type EventItem = {
  id: number;
  title: string;
  day: string;
  date: string;
  time: string;
  location: string;
  image_url: string | null;
};

export type Prayer = {
  id: number;
  intention: string;
  name: string;
  candles: number;
  created_at: string;
};

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

export type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  tag: string | null;
  created_at: string;
};

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

// Events store `date` as free text like "Jul 12" (no year). To show the
// soonest event first, parse it against the current year and roll into next
// year if that date has already passed — recurring parish events are always
// upcoming, never "last year's."
function parseEventDate(dateText: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const parsed = new Date(`${dateText} ${now.getFullYear()}`);
  if (isNaN(parsed.getTime())) return Number.MAX_SAFE_INTEGER; // unparseable → sort last
  const normalized = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  if (normalized < today) normalized.setFullYear(normalized.getFullYear() + 1);
  return normalized.getTime();
}

export async function fetchEvents(): Promise<EventItem[]> {
  const { data } = await supabase.from("events").select("*");
  return (data ?? []).sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));
}

export async function fetchPrayers(): Promise<Prayer[]> {
  const { data } = await supabase
    .from("prayer_wall")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function fetchLive(): Promise<LiveConfig | null> {
  const { data } = await supabase.from("live_stream_config").select("*").eq("id", 1).single();
  return data ?? null;
}

export async function lightCandle(prayerId: number) {
  const { error } = await supabase.rpc("increment_candles", { prayer_id: prayerId });
  if (error) throw error;
}

export async function lightAnnouncementCandle(announcementId: number) {
  const { error } = await supabase.rpc("increment_announcement_candles", { announcement_id: announcementId });
  if (error) throw error;
}

export async function postPrayer(intention: string, name: string): Promise<Prayer> {
  const { data, error } = await supabase
    .from("prayer_wall")
    .insert({ intention, name: name || "Anonymous" })
    .select()
    .single();
  if (error) throw error;
  return data as Prayer;
}

// ---- Live chat ----
export type ChatMessage = {
  id: number;
  name: string;
  message: string;
  created_at: string;
};

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

export async function postChat(name: string, message: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ name: name || "Guest", message })
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

// ---- Gallery ----
export type GalleryPhoto = {
  id: number;
  image_url: string;
  caption: string | null;
  created_at: string;
};

export async function fetchGallery(): Promise<GalleryPhoto[]> {
  const { data } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
