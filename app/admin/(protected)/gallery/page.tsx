"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { fetchGallery } from "@/lib/data";

const inputCls = "w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
const label = "mb-1.5 block text-[12.5px] font-semibold text-muted-foreground";

export default function ManageGallery() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["gallery"], queryFn: fetchGallery });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) { setMsg({ ok: false, t: "Upload an image first." }); return; }
    setBusy(true); setMsg(null);
    const res = await fetch("/api/admin/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image_url: imageUrl, caption }) });
    if (res.ok) { setImageUrl(null); setCaption(""); setMsg({ ok: true, t: "Photo added to the gallery." }); qc.invalidateQueries({ queryKey: ["gallery"] }); }
    else setMsg({ ok: false, t: (await res.json()).error || "Failed." });
    setBusy(false);
  };
  const remove = async (id: number) => {
    if (!confirm("Remove this photo?")) return;
    await fetch("/api/admin/gallery", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    qc.invalidateQueries({ queryKey: ["gallery"] });
  };

  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold">Gallery</h1>
      <form onSubmit={add} className="mb-7 space-y-3.5 border border-border bg-card p-5">
        <div><label className={label}>Photo</label><ImageUploader value={imageUrl} onChange={setImageUrl} folder="gallery" /></div>
        <div><label className={label}>Caption (optional)</label><input className={inputCls} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Harvest Sunday 2026" /></div>
        {msg && <p className={`px-3 py-2 text-[13px] ${msg.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>{msg.t}</p>}
        <Button type="submit" disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700">{busy ? "Adding…" : "Add to gallery"}</Button>
      </form>

      <h2 className="mb-3 text-[15px] font-semibold">Photos ({q.data?.length ?? 0})</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {(q.data ?? []).map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden border border-border bg-secondary">
            <img src={p.image_url} alt={p.caption ?? ""} className="h-full w-full object-cover" />
            <button onClick={() => remove(p.id)} aria-label="Delete photo" className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {q.data?.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No photos yet.</p>}
      </div>
    </div>
  );
}
