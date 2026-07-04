"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Flame } from "lucide-react";
import { fetchPrayers } from "@/lib/data";

export default function ModeratePrayers() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["prayers"], queryFn: fetchPrayers });

  const remove = async (id: number) => {
    if (!confirm("Remove this intention from the wall?")) return;
    await fetch("/api/admin/prayers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    qc.invalidateQueries({ queryKey: ["prayers"] });
  };
  const resetAll = async () => {
    if (!confirm("Clear the ENTIRE prayer wall? This removes every intention and cannot be undone.")) return;
    await fetch("/api/admin/prayers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reset: true }) });
    qc.invalidateQueries({ queryKey: ["prayers"] });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Prayer wall</h1>
        <button onClick={resetAll} className="flex items-center gap-1.5 border border-red-500/40 px-3 py-2 text-[13px] font-semibold text-red-500 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /> Reset entire wall</button>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">Parishioners post here without an account. Remove anything inappropriate. Consider resetting after each major feast or season.</p>

      <div className="space-y-2.5">
        {(q.data ?? []).map((p) => (
          <div key={p.id} className="flex items-center gap-4 border border-border bg-card p-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-light italic leading-snug">“{p.intention}”</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">{p.name} · <Flame className="h-3.5 w-3.5" /> {p.candles}</p>
            </div>
            <button onClick={() => remove(p.id)} className="flex flex-none items-center gap-1.5 border border-border px-3 py-2 text-[12.5px] font-semibold text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
          </div>
        ))}
        {q.data?.length === 0 && <p className="text-sm text-muted-foreground">The prayer wall is empty.</p>}
      </div>
    </div>
  );
}
