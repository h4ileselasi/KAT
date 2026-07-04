import { HandCoins, TrendingUp, Repeat, Users } from "lucide-react";
// @ts-ignore - JS module
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Donation = {
  id: number; reference: string; email: string | null; amount: number;
  fund: string | null; recurring: boolean; status: string; created_at: string;
};

const cedi = (n: number) => "₵" + n.toLocaleString();

export default async function AdminDonations() {
  const { data } = await supabaseAdmin
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  const donations: Donation[] = data ?? [];

  const successful = donations.filter((d) => d.status === "success");
  const now = Date.now();
  const weekAgo = now - 7 * 864e5;
  const monthAgo = now - 30 * 864e5;
  const sum = (arr: Donation[]) => arr.reduce((t, d) => t + (d.amount || 0), 0);

  const totalAll = sum(successful);
  const thisWeek = sum(successful.filter((d) => +new Date(d.created_at) >= weekAgo));
  const thisMonth = sum(successful.filter((d) => +new Date(d.created_at) >= monthAgo));
  const recurringCount = successful.filter((d) => d.recurring).length;
  const uniqueGivers = new Set(successful.map((d) => d.email).filter(Boolean)).size;

  // giving by fund
  const byFund = new Map<string, number>();
  for (const d of successful) byFund.set(d.fund || "Offering", (byFund.get(d.fund || "Offering") || 0) + d.amount);
  const funds = [...byFund.entries()].sort((a, b) => b[1] - a[1]);

  const metrics = [
    { label: "This week", value: cedi(thisWeek), icon: TrendingUp, tint: "bg-emerald-500/15 text-emerald-500" },
    { label: "This month", value: cedi(thisMonth), icon: HandCoins, tint: "bg-teal-500/15 text-teal-500" },
    { label: "Recurring gifts", value: String(recurringCount), icon: Repeat, tint: "bg-amber-500/15 text-amber-500" },
    { label: "Unique givers", value: String(uniqueGivers), icon: Users, tint: "bg-sky-500/15 text-sky-500" },
  ];

  const statusPill: Record<string, string> = {
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    failed: "bg-red-500/15 text-red-600 dark:text-red-300",
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-semibold">Giving</h1><p className="text-sm text-muted-foreground">Real donations, recorded &amp; verified via Paystack.</p></div>
        <div className="text-right"><p className="text-xs text-muted-foreground">All-time received</p><p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">{cedi(totalAll)}</p></div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12.5px] text-muted-foreground">{m.label}</span>
              <span className={`grid h-8 w-8 place-items-center ${m.tint}`}><m.icon className="h-4 w-4" /></span>
            </div>
            <p className="font-mono text-2xl font-bold tracking-tight">{m.value}</p>
          </div>
        ))}
      </div>

      {funds.length > 0 && (
        <div className="mb-4 border border-border bg-card">
          <div className="border-b border-border px-4 py-3.5"><h3 className="text-sm font-semibold">By fund</h3></div>
          <div className="divide-y divide-border">
            {funds.map(([fund, amount]) => (
              <div key={fund} className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px]">{fund}</span><span className="font-mono text-sm font-semibold">{cedi(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3.5"><h3 className="text-sm font-semibold">Recent donations</h3></div>
        {donations.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No donations yet. They'll appear here as parishioners give.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">Donor</th>
                  <th className="px-4 py-2.5 font-semibold">Fund</th>
                  <th className="px-4 py-2.5 font-semibold">Amount</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">When</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 text-[13px]">{d.email || "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{d.fund || "Offering"}{d.recurring && " · monthly"}</td>
                    <td className="px-4 py-3 font-mono text-[13px] font-semibold">{cedi(d.amount)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-[11px] font-semibold ${statusPill[d.status] || "bg-secondary text-muted-foreground"}`}>{d.status}</span></td>
                    <td className="hidden px-4 py-3 font-mono text-[12px] text-muted-foreground sm:table-cell">{new Date(d.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
