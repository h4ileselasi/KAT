"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

export default function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  // The recovery link signs the user in via a token in the URL; wait for that
  // session to be established before allowing a password change.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const input = "w-full border border-input bg-background px-3.5 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setMsg({ ok: false, t: "Password must be at least 6 characters." }); return; }
    if (password !== confirm) { setMsg({ ok: false, t: "Passwords don't match." }); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMsg({ ok: false, t: error.message }); return; }
    setMsg({ ok: true, t: "Password updated. Redirecting…" });
    setTimeout(() => { router.push("/"); router.refresh(); }, 1200);
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/brand/logo.png" alt="" width={88} height={88} className="h-[88px] w-[88px] object-contain" priority />
          <h1 className="mt-3 text-2xl font-semibold">Set a new password</h1>
          <p className="text-sm text-muted-foreground">St. Catherine of Siena · Burma Camp</p>
        </div>

        {!ready ? (
          <p className="border border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
            Open this page from the reset link in your email. If you got here by mistake,{" "}
            <Link href="/login" className="font-semibold text-primary-deep">go to sign in</Link>.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input className={input} type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <input className={input} type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            {msg && <p className={`px-3 py-2 text-[13px] ${msg.ok ? "bg-primary-soft text-primary-deep" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>{msg.t}</p>}
            <Button type="submit" disabled={busy} className="glow-primary w-full" size="lg">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
