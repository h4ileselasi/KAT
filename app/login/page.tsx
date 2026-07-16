"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const input = "w-full border border-input bg-background px-3.5 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMsg({ ok: true, t: "Check your email to confirm your account, then sign in." });
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/"); router.refresh();
      }
    } catch (err: any) {
      setMsg({ ok: false, t: err.message || "Something went wrong." });
    } finally { setBusy(false); }
  };

  const google = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  const forgot = async () => {
    if (!email.trim()) { setMsg({ ok: false, t: "Enter your email above first, then tap “Forgot password.”" }); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/auth/reset`,
    });
    setBusy(false);
    setMsg(error ? { ok: false, t: error.message } : { ok: true, t: "Check your email for a link to reset your password." });
  };

  return (
    <div className="app-wash grid min-h-[100dvh] place-items-center p-5">
      <div className="ambient-stage w-full max-w-sm">
        <div className="glass-strong border border-border p-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/brand/logo.png" alt="" width={88} height={88} className="h-[88px] w-[88px] object-contain" priority />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-sm text-muted-foreground">St. Catherine of Siena · Burma Camp</p>
        </div>

        <button onClick={google} className="card-surface card-surface-interactive mb-3 flex w-full items-center justify-center gap-2.5 py-3 text-sm font-semibold">
          <GoogleIcon /> Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />}
          <input className={input} type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {mode === "signin" && (
            <div className="text-right">
              <button type="button" onClick={forgot} className="text-[13px] font-medium text-primary-deep hover:underline">Forgot password?</button>
            </div>
          )}
          {msg && <p className={`px-3 py-2 text-[13px] ${msg.ok ? "bg-primary-soft text-primary-deep" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>{msg.t}</p>}
          <Button type="submit" disabled={busy} className="glow-primary w-full" size="lg">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }} className="font-semibold text-primary-deep">
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>

        <Link href="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          Continue as guest <ArrowRight className="h-4 w-4" />
        </Link>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
