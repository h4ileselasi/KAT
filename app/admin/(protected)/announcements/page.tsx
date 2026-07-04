"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { fetchAnnouncements } from "@/lib/data";

const inputCls = "w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
const label = "mb-1.5 block text-[12.5px] font-semibold text-muted-foreground";

export default function ManageAnnouncements() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
  const [form, setForm] = useState({ title: "", body: "", image_url: null as string | null, pinned: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const res = await fetch("/api/admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ title: "", body: "", image_url: null, pinned: false }); setMsg({ ok: true, t: "Announcement posted." }); qc.invalidateQueries({ queryKey: ["announcements"] }); }
    else setMsg({ ok: false, t: (await res.json()).error || "Failed." });
    setBusy(false);
  };
  const remove = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch("/api/admin/announcements", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    qc.invalidateQueries({ queryKey: ["announcements"] });
  };

  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold">Announcements</h1>
      <form onSubmit={create} className="mb-7 space-y-3.5 border border-border bg-card p-5">
        <div><label className={label}>Title</label><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Feast of St. Catherine — Novena begins" /></div>
        <div><label className={label}>Body</label><textarea className={inputCls + " min-h-[80px] resize-y"} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Details parishioners should know…" /></div>
        <div><label className={label}>Image</label><ImageUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="announcements" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin to top of the feed</label>
        {msg && <p className={`px-3 py-2 text-[13px] ${msg.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>{msg.t}</p>}
        <Button type="submit" disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700">{busy ? "Posting…" : "Post announcement"}</Button>
      </form>

      <h2 className="mb-3 text-[15px] font-semibold">Posted ({q.data?.length ?? 0})</h2>
      <div className="space-y-2.5">
        {(q.data ?? []).map((a) => (
          <div key={a.id} className="flex items-center gap-4 border border-border bg-card p-3">
            {a.image_url ? <img src={a.image_url} alt="" className="h-12 w-12 flex-none object-cover" /> : <div className="h-12 w-12 flex-none bg-secondary" />}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{a.pinned && "📌 "}{a.title}</p><p className="truncate text-[12.5px] text-muted-foreground">{a.body}</p></div>
            <button onClick={() => remove(a.id)} className="flex items-center gap-1.5 border border-border px-3 py-2 text-[12.5px] font-semibold text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          </div>
        ))}
        {q.data?.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
      </div>
    </div>
  );
}
