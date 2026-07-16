"use client";

import Link from "next/link";
import { Settings as SettingsIcon, ChevronRight, LogIn, LogOut } from "lucide-react";
import { SiteShell } from "@/components/site/shell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FadeUp } from "@/components/site/motion";
import { useAuth, displayName } from "@/components/auth/auth-provider";

function Content() {
  const { user, loading, signOut } = useAuth();
  return (
    <FadeUp className="mx-auto max-w-2xl px-3 pb-32 pt-5 sm:px-6 lg:pb-16">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary-deep"><SettingsIcon className="h-5 w-5" /></span>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      {/* Account */}
      <div className="card-surface mb-5">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">…</div>
        ) : user ? (
          <div className="flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gold font-bold text-[hsl(var(--foreground))]">{displayName(user)[0]?.toUpperCase()}</span>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{displayName(user)}</p><p className="truncate text-sm text-muted-foreground">{user.email}</p></div>
            <button onClick={signOut} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-secondary"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        ) : (
          <Link href="/login" className="flex items-center justify-between p-4 transition-colors hover:bg-secondary">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary-deep"><LogIn className="h-5 w-5" /></span>
              <div><p className="font-semibold">Sign in or create an account</p><p className="text-sm text-muted-foreground">You're browsing as a guest</p></div></div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        )}
      </div>

      <div className="card-surface">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div><p className="font-semibold">Appearance</p><p className="text-sm text-muted-foreground">Light or dark — whatever's easy on the eyes.</p></div>
          <ThemeToggle />
        </div>
        <Link href="/admin" className="flex items-center justify-between p-4 transition-colors hover:bg-secondary">
          <div><p className="font-semibold">Parish staff login</p><p className="text-sm text-muted-foreground">Admin workspace</p></div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      <div className="card-surface mt-5 p-4">
        <p className="font-semibold">About</p>
        <p className="mt-1 text-sm text-muted-foreground">
          St. Catherine of Siena Catholic Church · Burma Camp, Accra.<br />
          Watch live Mass, share intentions, give, and stay connected.
        </p>
      </div>
    </FadeUp>
  );
}

export default function SettingsPage() {
  return <SiteShell><Content /></SiteShell>;
}
