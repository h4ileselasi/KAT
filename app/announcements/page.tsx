"use client";

import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { SiteShell } from "@/components/site/shell";
import { AnnouncementPost, FeedSkeleton } from "@/components/site/feed";
import { FadeUp } from "@/components/site/motion";
import { fetchAnnouncements } from "@/lib/data";

function Content() {
  const q = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
  return (
    <div className="mx-auto max-w-2xl px-3 pb-32 pt-5 sm:px-6 lg:pb-16">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary-deep"><Megaphone className="h-5 w-5" /></span>
        <div><h1 className="text-2xl font-semibold tracking-tight">Announcements</h1><p className="text-sm text-muted-foreground">News from the parish.</p></div>
      </div>
      {q.isLoading ? <FeedSkeleton /> : (
        <div className="space-y-4">
          {(q.data ?? []).map((a, i) => <FadeUp key={a.id} delay={Math.min(i * 0.05, 0.3)}><AnnouncementPost item={a} /></FadeUp>)}
          {q.data?.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No announcements yet.</p>}
        </div>
      )}
    </div>
  );
}

export default function AnnouncementsPage() {
  return <SiteShell><Content /></SiteShell>;
}
