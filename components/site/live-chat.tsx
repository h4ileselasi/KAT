"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth, displayName } from "@/components/auth/auth-provider";
import { useLiveConfig } from "@/lib/use-live";
import { fetchChat, postChat, type ChatMessage } from "@/lib/data";

/* Live service chat. Realtime delivery over Supabase (a slow poll remains as
   a safety net), scoped to the current service: keyed by session_started_at
   so every go-live starts a fresh room. Sending is optimistic. `dark` styles
   it for the dark watch surfaces. */
export function LiveChat({ dark = false }: { dark?: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: live } = useLiveConfig();
  const since = live?.session_started_at ?? null;
  const chatKey = ["chat", since ?? "all"] as const;

  const chat = useQuery({
    queryKey: chatKey,
    queryFn: () => fetchChat(since),
    refetchInterval: 30_000, // safety net; realtime does the real work
  });

  // Realtime delivery. Dedupe against optimistic entries (temp id = Date.now()).
  // Channel name is unique per mount: two LiveChat instances can be up at once
  // (/live page + WatchView overlay) and Supabase channels are keyed by topic.
  useEffect(() => {
    const ch = supabase
      .channel(`live-chat-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = payload.new as ChatMessage;
          qc.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
            if (old.some((m) => m.id === row.id)) return old;
            const tempIdx = old.findIndex(
              (m) => m.id > 1e12 && m.name === row.name && m.message === row.message
            );
            if (tempIdx >= 0) {
              const next = [...old];
              next[tempIdx] = row;
              return next;
            }
            return [...old, row];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, since]);

  const send = useMutation({
    mutationFn: (vars: { name: string; message: string }) => postChat(vars.name, vars.message),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: chatKey });
      const prev = qc.getQueryData<ChatMessage[]>(chatKey);
      const optimistic: ChatMessage = { id: Date.now(), name: vars.name, message: vars.message, created_at: new Date().toISOString() };
      qc.setQueryData<ChatMessage[]>(chatKey, (old) => [...(old ?? []), optimistic]);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(chatKey, ctx.prev); },
  });

  // auto-scroll to newest
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.data?.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = text.trim();
    if (!message) return;
    const name = user ? displayName(user) : "Guest";
    send.mutate({ name, message });
    setText("");
  };

  const messages = chat.data ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className={`min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3.5 ${dark ? "" : ""}`}>
        {messages.length === 0 ? (
          <p className={`text-center text-[13px] ${dark ? "text-slate-400" : "text-muted-foreground"}`}>Be the first to say hello 👋</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-2.5">
              <span className={`grid h-7 w-7 flex-none place-items-center rounded-full text-[12px] font-bold ${dark ? "bg-white/10 text-gold" : "bg-primary-soft text-primary-deep"}`}>
                {m.name[0]?.toUpperCase() ?? "?"}
              </span>
              <p className={`text-[13px] leading-relaxed ${dark ? "text-slate-200" : ""}`}>
                <b className={`font-semibold ${dark ? "text-gold" : ""}`}>{m.name}</b>{" "}
                <span className={dark ? "text-slate-300" : "text-muted-foreground"}>{m.message}</span>
              </p>
            </div>
          ))
        )}
      </div>
      <form onSubmit={submit} className={`flex gap-2 border-t p-3 ${dark ? "border-[#1a222b]" : "border-border"}`}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={280}
          placeholder="Say something kind…"
          className={`min-w-0 flex-1 rounded-full px-4 py-2.5 text-[13px] outline-none focus-visible:ring-2 ${dark ? "border border-[#232c36] bg-[#12181f] text-white focus-visible:ring-primary" : "border border-input bg-background focus-visible:ring-ring"}`}
        />
        <button type="submit" className="glow-primary grid w-11 flex-none place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50" disabled={!text.trim() || send.isPending}>
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
