"use client";

import { useQuery } from "@tanstack/react-query";
import { Store as StoreIcon } from "lucide-react";
import { SiteShell } from "@/components/site/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProducts } from "@/lib/data";

function Content() {
  const q = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  return (
    <div className="mx-auto max-w-3xl px-3 pb-32 pt-5 sm:px-6 lg:pb-16">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary-deep"><StoreIcon className="h-5 w-5" /></span>
        <div><h1 className="text-2xl font-semibold">St. Catherine Store</h1><p className="text-sm text-muted-foreground">Blessed items. Every purchase supports our ministries.</p></div>
      </div>
      {q.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[3/4] w-full" />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(q.data ?? []).map((p) => (
            <article key={p.id} className="card-surface card-surface-interactive group relative overflow-hidden">
              {p.tag && <span className="absolute left-2 top-2 z-10 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#241a05]">{p.tag}</span>}
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : <div className="aspect-square w-full bg-secondary" />}
              <div className="p-3">
                <h3 className="text-sm font-semibold leading-tight">{p.name}</h3>
                <p className="num mt-1 font-semibold text-primary-deep">GHS {p.price}</p>
              </div>
            </article>
          ))}
          {q.data?.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground">Store items coming soon.</p>}
        </div>
      )}
    </div>
  );
}

export default function StorePage() {
  return <SiteShell><Content /></SiteShell>;
}
