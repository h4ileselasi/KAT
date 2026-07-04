"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site/shell";
import { PrayerPost, FeedSkeleton } from "@/components/site/feed";
import { Button } from "@/components/ui/button";
import { useAuth, displayName } from "@/components/auth/auth-provider";
import { fetchPrayers, postPrayer, type Prayer } from "@/lib/data";

function PrayerContent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const prayers = useQuery({ queryKey: ["prayers"], queryFn: fetchPrayers });
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [anon, setAnon] = useState(false);

  // Signed-in parishioners post under their name by default.
  useEffect(() => {
    if (user) setName(displayName(user));
  }, [user]);

  // The intention/name are passed as mutation VARIABLES (not read from the
  // component closure), so clearing the inputs after dispatch can never make
  // the insert use an empty string.
  const post = useMutation({
    mutationFn: (vars: { intention: string; name: string }) => postPrayer(vars.intention, vars.name),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["prayers"] });
      const prev = qc.getQueryData<Prayer[]>(["prayers"]);
      const optimistic: Prayer = {
        id: Date.now(), intention: vars.intention, name: vars.name,
        candles: 0, created_at: new Date().toISOString(),
      };
      qc.setQueryData<Prayer[]>(["prayers"], (old) => [optimistic, ...(old ?? [])]);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["prayers"], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["prayers"] }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const intention = text.trim();
    if (!intention || post.isPending) return;
    const finalName = anon || !name.trim() ? "Anonymous" : name.trim();
    post.mutate({ intention, name: finalName });
    setText(""); // safe: mutate captured the value above
  };

  return (
    <div className="mx-auto max-w-2xl px-3 pb-32 pt-5 sm:px-6 lg:pb-16">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary-deep"><Sparkles className="h-5 w-5" /></span>
        <div>
          <h1 className="text-2xl font-semibold">Prayer Wall</h1>
          <p className="text-sm text-muted-foreground">Share an intention — no account needed. Light a candle for another.</p>
        </div>
      </div>

      <p className="mb-6 border-l-2 border-gold pl-4 text-[15px] font-light italic leading-relaxed text-muted-foreground">
        “Again I say to you, if two of you agree on earth about anything they ask, it will be done for them by my Father.” — Matthew 18:19
      </p>

      <form onSubmit={submit} className="card-surface mb-7 space-y-3 p-4">
        <label className="text-sm font-semibold">Share a Mass intention</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500}
          placeholder="Lord, I pray for…"
          className="w-full resize-y border border-input bg-background p-3 text-[15px] italic outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        {!anon && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
            className="w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        )}
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> Post anonymously
        </label>
        <Button type="submit" disabled={post.isPending} className="glow-primary">{post.isPending ? "Posting…" : "Post intention"}</Button>
        <p className="text-xs text-muted-foreground">Please keep intentions reverent — the parish office may remove anything inappropriate.</p>
      </form>

      {prayers.isLoading ? <FeedSkeleton /> : (
        <div className="space-y-4">
          {(prayers.data ?? []).map((p) => <PrayerPost key={p.id} item={p} />)}
          {prayers.data?.length === 0 && <p className="text-center text-sm text-muted-foreground">Be the first to share an intention.</p>}
        </div>
      )}
    </div>
  );
}

export default function PrayerPage() {
  return <SiteShell><PrayerContent /></SiteShell>;
}
