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
