"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string; // e.g. "announcements", "events", "products"
}

export function ImageUploader({ value, onChange, folder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10 MB."); return; }
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      const { url } = await res.json();
      onChange(url);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 border border-border bg-background p-2.5">
        <img src={value} alt="" className="h-14 w-14 flex-none object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium">Image uploaded</p>
          <div className="mt-1.5 h-1 bg-secondary"><div className="h-full w-full bg-emerald-500" /></div>
        </div>
        <button type="button" onClick={() => onChange(null)} aria-label="Remove image" className="px-1.5 text-muted-foreground hover:text-red-500"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files?.[0]); }}
        className={`flex w-full flex-col items-center gap-3 border border-dashed p-6 text-center transition-colors ${over ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-background hover:border-emerald-500 hover:bg-emerald-500/5"}`}
      >
        <span className="grid h-11 w-11 place-items-center border border-border text-emerald-500">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
        </span>
        <span className="text-[13.5px] font-semibold">{busy ? "Uploading…" : <>Drag &amp; drop an image, or <em className="not-italic text-emerald-600 dark:text-emerald-400">browse files</em></>}</span>
        <span className="text-[11.5px] text-muted-foreground">PNG, JPG or WEBP · up to 10 MB</span>
      </button>
      {error && <p className="mt-2 text-[12.5px] text-red-500">{error}</p>}
    </div>
  );
}
