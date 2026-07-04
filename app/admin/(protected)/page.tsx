import Link from "next/link";
import { HandCoins, TrendingUp, Sparkles, Megaphone, Plus } from "lucide-react";
// @ts-ignore - JS module
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const cedi = (n: number) => "₵" + n.toLocaleString();

async function count(table: string) {
  const { count } = await supabaseAdmin.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function AdminDashboard() {
  const [annCount, evCount, prodCount, prayerCount, donationsRes, prayersRes] = await Promise.all([
    count("announcements"), count("events"), count("products"), count("prayer_wall"),
    supabaseAdmin.from("donations").select("*").eq("status", "success").order("created_at", { ascending: false }).limit(300),
    supabaseAdmin.from("prayer_wall").select("id,name,intention,created_at").order("created_at", { ascending: false }).limit(6),
  ]);

  const donations = donationsRes.data ?? [];
  const now = Date.now();
  const sum = (arr: any[]) => arr.reduce((t, d) => t + (d.amount || 0), 0);
  const givingThisWeek = sum(donations.filter((d) => +new Date(d.created_at) >= now - 7 * 864e5));
  const givingTotal = sum(donations);

  // last 8 weeks of giving for the chart (oldest → newest)
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = now - (7 - i) * 7 * 864e5;
    const start = end - 7 * 864e5;
    return sum(donations.filter((d) => { const t = +new Date(d.created_at); return t >= start && t < end; }));
  });
  const maxWeek = Math.max(1, ...weeks);

  // real activity feed: merge recent donations + prayers
  const activity = [
    ...donations.slice(0, 5).map((d) => ({ t: +new Date(d.created_at), who: d.email || "Anonymous", init: (d.email || "A")[0].toUpperCase(), color: "bg-amber-500 text-amber-950", detail: `Gave to ${d.fund || "Offering"}`, type: `Gift · ${cedi(d.amount)}`, pill: "bg-amber-500/15 text-amber-700 dark:text-amber-300", when: new Date(d.created_at) })),
    ...(prayersRes.data ?? []).map((p: any) => ({ t: +new Date(p.created_at), who: p.name, init: (p.name || "A")[0].toUpperCase(), color: "bg-emerald-500 text-emerald-950", detail: `"${(p.intention || "").slice(0, 40)}${(p.intention || "").length > 40 ? "…" : ""}"`, type: "Prayer", pill: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", when: new Date(p.created_at) })),
  ].sort((a, b) => b.t - a.t).slice(0, 6);

  const rel = (d: Date) => {
    const s = Math.floor((now - +d) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  };

  const metrics = [
    { label: "Giving this week", value: cedi(givingThisWeek), icon: TrendingUp, tint: "bg-emerald-500/15 text-emerald-500", href: "/admin/donations" },
    { label: "All-time received", value: cedi(givingTotal), icon: HandCoins, tint: "bg-teal-500/15 text-teal-500", href: "/admin/donations" },
    { label: "Prayer intentions", value: String(prayerCount), icon: Sparkles, tint: "bg-sky-500/15 text-sky-500", href: "/admin/prayers" },
    { label: "Announcements", value: String(annCount), icon: Megaphone, tint: "bg-amber-500/15 text-amber-500", href: "/admin/announcements" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-semibold">Good morning, Father</h1><p className="text-sm text-muted-foreground">Here's what's happening across the parish this week.</p></div>
        <Link href="/admin/announcements" className="inline-flex items-center gap-2 bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> New announcement</Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {metrics.map((m) => (
          <Link key={m.label} href={m.href} className="border border-border bg-card p-4 transition-colors hover:border-emerald-500/40">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12.5px] text-muted-foreground">{m.label}</span>
              <span className={`grid h-8 w-8 place-items-center ${m.tint}`}><m.icon className="h-4 w-4" /></span>
            </div>
            <p className="font-mono text-2xl font-bold tracking-tight">{m.value}</p>
          </Link>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5"><div><h3 className="text-sm font-semibold">Giving trend</h3><p className="text-xs text-muted-foreground">Last 8 weeks · GHS</p></div></div>
          <div className="p-5">
            {givingTotal === 0 ? (
              <div className="grid h-40 place-items-center text-sm text-muted-foreground">No giving recorded yet.</div>
            ) : (
              <>
                <div className="flex h-40 items-end gap-2.5">
                  {weeks.map((w, i) => (
                    <div key={i} className={`flex-1 ${i === weeks.length - 1 ? "bg-teal-500" : "bg-emerald-500"}`} style={{ height: `${Math.max(4, (w / maxWeek) * 100)}%`, opacity: 0.4 + (w / maxWeek) * 0.6 }} title={cedi(w)} />
                  ))}
                </div>
                <div className="mt-2.5 flex gap-2.5 font-mono text-[11px] text-muted-foreground">
                  {["W1", "W2", "W3", "W4", "W5", "W6", "W7", "Now"].map((w) => <span key={w} className="flex-1 text-center">{w}</span>)}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3.5"><h3 className="text-sm font-semibold">Content</h3></div>
          <div className="divide-y divide-border">
            {[["Announcements", annCount, "/admin/announcements"], ["Events", evCount, "/admin/events"], ["Store items", prodCount, "/admin/products"], ["Prayer intentions", prayerCount, "/admin/prayers"]].map(([l, n, href]) => (
              <Link key={l as string} href={href as string} className="flex items-center justify-between px-4 py-3 hover:bg-secondary">
                <span className="text-[13px] text-muted-foreground">{l}</span><span className="font-mono text-sm font-semibold">{n}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3.5"><h3 className="text-sm font-semibold">Recent activity</h3></div>
        {activity.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className={`grid h-7 w-7 flex-none place-items-center rounded-[3px] text-[11px] font-bold ${a.color}`}>{a.init}</span>
                <span className="w-28 flex-none truncate text-[13px] font-medium">{a.who}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">{a.detail}</span>
                <span className={`flex-none px-2 py-1 text-[11px] font-semibold ${a.pill}`}>{a.type}</span>
                <span className="hidden w-16 flex-none text-right font-mono text-[12px] text-muted-foreground sm:block">{rel(a.when)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
