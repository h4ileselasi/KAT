"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { fetchProducts } from "@/lib/data";

const inputCls = "w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
const label = "mb-1.5 block text-[12.5px] font-semibold text-muted-foreground";
const EMPTY = { name: "", price: "", tag: "", image_url: null as string | null };

export default function ManageProducts() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const res = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm(EMPTY); setMsg({ ok: true, t: "Product added." }); qc.invalidateQueries({ queryKey: ["products"] }); }
    else setMsg({ ok: false, t: (await res.json()).error || "Failed." });
    setBusy(false);
  };
  const remove = async (id: number) => {
    if (!confirm("Remove this product?")) return;
    await fetch("/api/admin/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold">Store</h1>
      <form onSubmit={create} className="mb-7 space-y-3.5 border border-border bg-card p-5">
        <div><label className={label}>Product name</label><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Blessed Rosary" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Price (GHS)</label><input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="45" /></div>
          <div><label className={label}>Tag (optional)</label><input className={inputCls} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="Bestseller / New" /></div>
        </div>
        <div><label className={label}>Image</label><ImageUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="products" /></div>
        {msg && <p className={`px-3 py-2 text-[13px] ${msg.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>{msg.t}</p>}
        <Button type="submit" disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700">{busy ? "Adding…" : "Add product"}</Button>
      </form>

      <h2 className="mb-3 text-[15px] font-semibold">Listed ({q.data?.length ?? 0})</h2>
      <div className="space-y-2.5">
        {(q.data ?? []).map((p) => (
          <div key={p.id} className="flex items-center gap-4 border border-border bg-card p-3">
            {p.image_url ? <img src={p.image_url} alt="" className="h-12 w-12 flex-none object-cover" /> : <div className="h-12 w-12 flex-none bg-secondary" />}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.name}</p><p className="text-[12.5px] text-muted-foreground">GHS {p.price}{p.tag ? ` · ${p.tag}` : ""}</p></div>
            <button onClick={() => remove(p.id)} className="flex items-center gap-1.5 border border-border px-3 py-2 text-[12.5px] font-semibold text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          </div>
        ))}
        {q.data?.length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
      </div>
    </div>
  );
}
