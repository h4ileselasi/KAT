"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { fetchEvents } from "@/lib/data";

const inputCls = "w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
const label = "mb-1.5 block text-[12.5px] font-semibold text-muted-foreground";
const EMPTY = { title: "", day: "", date: "", time: "", location: "", image_url: null as string | null };

export default function ManageEvents() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const res = await fetch("/api/admin/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm(EMPTY); setMsg({ ok: true, t: "Event added." }); qc.invalidateQueries({ queryKey: ["events"] }); }
    else setMsg({ ok: false, t: (await res.json()).error || "Failed." });
    setBusy(false);
  };
  const remove = async (id: number) => {
    if (!confirm("Delete this event?")) return;
    await fetch("/api/admin/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    qc.invalidateQueries({ queryKey: ["events"] });
  };

  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold">Events</h1>
      <form onSubmit={create} className="mb-7 space-y-3.5 border border-border bg-card p-5">
        <div><label className={label}>Title</label><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Parish Family Picnic" /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className={label}>Day</label><input className={inputCls} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} placeholder="Sat" /></div>
          <div><label className={label}>Date</label><input className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="Jul 12" /></div>
          <div><label className={label}>Time</label><input className={inputCls} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="12:00 PM" /></div>
        </div>
        <div><label className={label}>Location</label><input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Church Grounds" /></div>
        <div><label className={label}>Image (optional)</label><ImageUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="events" /></div>
        {msg && <p className={`px-3 py-2 text-[13px] ${msg.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>{msg.t}</p>}
        <Button type="submit" disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700">{busy ? "Adding…" : "Add event"}</Button>
      </form>

      <h2 className="mb-3 text-[15px] font-semibold">Scheduled ({q.data?.length ?? 0})</h2>
      <div className="space-y-2.5">
        {(q.data ?? []).map((e) => (
          <div key={e.id} className="flex items-center gap-4 border border-border bg-card p-3">
            <div className="grid h-12 w-12 flex-none place-items-center bg-emerald-500/15 text-center leading-none text-emerald-700 dark:text-emerald-300"><b className="text-base font-bold">{e.date.split(" ")[1]}</b><small className="text-[9px] uppercase">{e.date.split(" ")[0]}</small></div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{e.title}</p><p className="truncate text-[12.5px] text-muted-foreground">{e.day} · {e.time} · {e.location}</p></div>
            <button onClick={() => remove(e.id)} className="flex items-center gap-1.5 border border-border px-3 py-2 text-[12.5px] font-semibold text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          </div>
        ))}
        {q.data?.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
      </div>
    </div>
  );
}
