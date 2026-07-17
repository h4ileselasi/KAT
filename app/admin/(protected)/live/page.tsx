"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { fetchLive, type LiveConfig } from "@/lib/data";
import { type ServiceTime } from "@/lib/live-utils";

const inputCls = "w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
const label = "mb-1.5 block text-[12.5px] font-semibold text-muted-foreground";

export default function ManageLive() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["live"], queryFn: fetchLive });
  const cfg = q.data;
  const [form, setForm] = useState<Partial<LiveConfig> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const f = form ?? cfg ?? { is_live: false, title: "", subtitle: "", embed_url: "", poster_url: "", youtube_playlist_id: "", schedule: [] };
  const set = (patch: Partial<LiveConfig>) => setForm({ ...f, ...patch });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const res = await fetch("/api/admin/live", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_live: f.is_live, title: f.title, subtitle: f.subtitle, embed_url: f.embed_url, poster_url: f.poster_url, youtube_playlist_id: f.youtube_playlist_id || null, schedule: f.schedule ?? [] }),
    });
    if (res.ok) { setMsg({ ok: true, t: "Live stream settings saved. The site updates on next load." }); qc.invalidateQueries({ queryKey: ["live"] }); }
    else setMsg({ ok: false, t: (await res.json()).error || "Failed." });
    setBusy(false);
  };

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Live stream</h1>
      <p className="mb-5 text-sm text-muted-foreground">Set what parishioners see on the home page and the Live tab.</p>

      <form onSubmit={save} className="max-w-2xl space-y-4 border border-border bg-card p-5">
        <label className="flex items-center gap-3 text-[15px] font-semibold">
          <button type="button" onClick={() => set({ is_live: !f.is_live })}
            className={`relative h-6 w-11 flex-none transition-colors ${f.is_live ? "bg-red-500" : "bg-secondary"}`} aria-pressed={!!f.is_live}>
            <span className={`absolute top-0.5 h-5 w-5 bg-white transition-all ${f.is_live ? "right-0.5" : "left-0.5"}`} />
          </button>
          We are LIVE right now
        </label>
        <p className="-mt-2 text-[12.5px] text-muted-foreground">Turn on when the service starts — the LIVE badge appears everywhere instantly and a fresh chat session begins.</p>

        <div><label className={label}>Service title</label><input className={inputCls} value={f.title ?? ""} onChange={(e) => set({ title: e.target.value })} placeholder="Sunday Holy Mass — 9:00 AM" /></div>
        <div><label className={label}>Subtitle</label><input className={inputCls} value={f.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Celebrant: Fr. Emmanuel Okoye" /></div>
        <div>
          <label className={label}>Embed URL (YouTube / streaming iframe)</label>
          <input className={inputCls} value={f.embed_url ?? ""} onChange={(e) => set({ embed_url: e.target.value })} placeholder="https://www.youtube.com/embed/…" />
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">YouTube: open your live video → Share → Embed → copy the URL inside src=&quot;…&quot;.</p>
        </div>
        <div><label className={label}>Poster / thumbnail</label><ImageUploader value={f.poster_url ?? null} onChange={(url) => set({ poster_url: url })} folder="live" /></div>

        <div>
          <label className={label}>YouTube playlist ID (optional)</label>
          <input className={inputCls} value={f.youtube_playlist_id ?? ""} onChange={(e) => set({ youtube_playlist_id: e.target.value })} placeholder="PLxxxxxxxxxxxxxxxx" />
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">If set, &ldquo;Previous services&rdquo; shows this playlist (e.g. a Sunday Mass playlist). Otherwise the channel&rsquo;s uploads are used.</p>
        </div>

        <div>
          <label className={label}>Weekly service schedule</label>
          <p className="mb-2 text-[11.5px] text-muted-foreground">Shown on the Live page with a countdown when you&rsquo;re offline.</p>
          <div className="space-y-2">
            {(f.schedule ?? []).map((s: ServiceTime, i: number) => (
              <div key={i} className="flex gap-2">
                <select className={`${inputCls} w-32 flex-none`} value={s.day}
                  onChange={(e) => set({ schedule: (f.schedule ?? []).map((x: ServiceTime, j: number) => j === i ? { ...x, day: Number(e.target.value) } : x) })}>
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d, di) => <option key={d} value={di}>{d}</option>)}
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

        {msg && <p className={`px-3 py-2 text-[13px] ${msg.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>{msg.t}</p>}
        <Button type="submit" disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700">{busy ? "Saving…" : "Save settings"}</Button>
      </form>
    </div>
  );
}
