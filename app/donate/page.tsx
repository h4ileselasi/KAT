"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Gift, Smartphone, CreditCard, Lock, Loader2 } from "lucide-react";
import { SiteShell } from "@/components/site/shell";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/site/motion";
import { useAuth } from "@/components/auth/auth-provider";

const PRESETS = [20, 50, 100, 200];
const FUNDS = ["Tithe", "Offering", "Building Fund", "Missions & Charity"];

function Content() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialAmount = Math.max(1, parseInt(searchParams.get("amount") || "50", 10) || 50);
  const [amount, setAmount] = useState(initialAmount);
  const [fund, setFund] = useState(FUNDS[0]);
  const [recurring, setRecurring] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const give = async () => {
    if (!email.trim()) { setError("Please enter your email for the receipt."); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, fund, email: email.trim(), recurring }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment.");
      window.location.href = data.authorization_url; // Paystack hosted checkout
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <FadeUp className="ambient-warm mx-auto max-w-2xl px-3 pb-32 pt-5 sm:px-6 lg:pb-16">
      <div className="mb-5 bg-primary-ink p-6 text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_12px_32px_-16px_hsl(var(--primary-ink)/0.7)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">Give</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Give with a grateful heart</h1>
        <p className="mt-1 text-sm text-slate-300">“Each of you should give what you have decided in your heart to give.” — 2 Cor 9:7</p>
      </div>

      <Label>Give toward</Label>
      <div className="mb-6 mt-2 flex flex-wrap gap-2">
        {FUNDS.map((f) => (
          <button key={f} onClick={() => setFund(f)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${fund === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-secondary"}`}>{f}</button>
        ))}
      </div>

      <Label>Amount (GHS)</Label>
      <div className="mb-3 mt-2 grid grid-cols-2 gap-3">
        {PRESETS.map((v) => (
          <button key={v} onClick={() => setAmount(v)}
            className={`num border py-4 text-lg font-bold transition-all ${amount === v ? "glow-gold scale-[1.03] border-gold bg-gold-soft text-primary-deep ring-1 ring-gold" : "card-surface"}`}>GHS {v}</button>
        ))}
      </div>
      <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(Math.max(1, +e.target.value || 1))}
        aria-label="Custom amount"
        className="num mb-4 w-full border border-input bg-background px-4 py-3 text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring" />

      <Label>Email (for your receipt)</Label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
        className="mb-4 mt-2 w-full border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />

      <label className="mb-5 flex items-center gap-3 text-sm">
        <button type="button" onClick={() => setRecurring(!recurring)} aria-pressed={recurring}
          className={`relative h-6 w-11 flex-none rounded-full transition-colors ${recurring ? "bg-primary" : "bg-secondary"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${recurring ? "right-0.5" : "left-0.5"}`} />
        </button>
        Make this a monthly gift
      </label>

      <Label>Payment method</Label>
      <div className="mb-6 mt-2 grid grid-cols-3 gap-3">
        <Method icon={<Smartphone className="h-5 w-5" />} label="MTN MoMo" />
        <Method icon={<Smartphone className="h-5 w-5" />} label="Telecel Cash" />
        <Method icon={<CreditCard className="h-5 w-5" />} label="Card" />
      </div>

      {error && <p className="mb-3 bg-red-500/10 px-3 py-2 text-[13px] text-red-600 dark:text-red-300">{error}</p>}
      <Button className="glow-primary num w-full text-base" size="lg" onClick={give} disabled={busy}>
        {busy ? <><Loader2 className="mr-1 h-5 w-5 animate-spin" /> Starting…</> : <><Gift className="mr-1 h-5 w-5" /> Give GHS {amount} to {fund}{recurring ? " / month" : ""}</>}
      </Button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" /> Secured by Paystack · MoMo, Telecel &amp; card · You choose the method on the next screen.
      </p>
    </FadeUp>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}
function Method({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="card-surface flex flex-col items-center gap-1.5 p-3 text-center text-xs font-semibold">
      <span className="text-primary-deep">{icon}</span>{label}
    </div>
  );
}

export default function DonatePage() {
  return (
    <SiteShell>
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <Content />
      </Suspense>
    </SiteShell>
  );
}
