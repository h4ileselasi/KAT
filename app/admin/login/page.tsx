"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { router.push("/admin"); router.refresh(); }
      else setError((await res.json()).error || "Login failed");
    } catch { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-5">
      <form onSubmit={submit} className="w-full max-w-sm border border-border bg-card p-7 text-center">
        <Image src="/brand/logo.png" alt="" width={72} height={72} className="mx-auto h-[72px] w-[72px] object-contain" />
        <h1 className="mt-3 text-xl font-semibold">Parish Admin</h1>
        <p className="mb-5 text-sm text-muted-foreground">St. Catherine of Siena · Burma Camp</p>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password" autoFocus
          className="mb-3 w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        />
        {error && <p className="mb-3 bg-red-500/10 px-3 py-2 text-[13px] text-red-600 dark:text-red-300">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
          {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
