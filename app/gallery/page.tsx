"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Image as ImageIcon } from "lucide-react";
import { SiteShell } from "@/components/site/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchGallery } from "@/lib/data";

function Content() {
  const q = useQuery({ queryKey: ["gallery"], queryFn: fetchGallery });
  const [open, setOpen] = useState<string | null>(null);
  const photos = q.data ?? [];

  return (
    <div className="pb-32 pt-5 lg:pb-16">
      <div className="mb-4 flex items-center gap-3 px-4 sm:px-6">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary-deep"><ImageIcon className="h-5 w-5" /></span>
        <div><h1 className="text-2xl font-semibold">Gallery</h1><p className="text-sm text-muted-foreground">Moments from parish life.</p></div>
      </div>

      {q.isLoading ? (
        <div className="grid grid-cols-3 gap-[3px]">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}</div>
      ) : photos.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-muted-foreground">No photos yet. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-3 gap-[3px]">
          {photos.map((p) => (
            <button key={p.id} onClick={() => setOpen(p.image_url)} className="group relative aspect-square overflow-hidden bg-secondary">
              <img src={p.image_url} alt={p.caption ?? ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div onClick={() => setOpen(null)} className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-4">
          <button aria-label="Close" className="absolute right-4 top-[calc(env(safe-area-inset-top)+12px)] grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white"><X /></button>
          <img src={open} alt="" className="max-h-[85vh] max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  return <SiteShell><Content /></SiteShell>;
}
