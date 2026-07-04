import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, XCircle } from "lucide-react";
// @ts-ignore - JS module
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function verify(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const data = await res.json();
  return data?.data;
}

export default async function DonateCallback({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference || params.trxref;
  let ok = false;
  let amount = 0;
  let fund = "";

  if (reference) {
    const tx = await verify(reference);
    ok = tx?.status === "success";
    amount = tx?.amount ? Math.round(tx.amount / 100) : 0;
    fund = tx?.metadata?.fund || "";
    // Reconcile the recorded donation (idempotent by reference).
    await supabaseAdmin
      .from("donations")
      .update({ status: ok ? "success" : "failed" })
      .eq("reference", reference);
  }

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-5">
      <div className="card-surface w-full max-w-sm p-8 text-center">
        <Image src="/brand/logo.png" alt="" width={72} height={72} className="mx-auto h-[72px] w-[72px] object-contain" />
        {ok ? (
          <>
            <span className="mx-auto mt-4 grid h-14 w-14 place-items-center rounded-full bg-primary-soft"><CheckCircle2 className="h-8 w-8 text-primary-deep" /></span>
            <h1 className="mt-3 text-2xl font-semibold">Thank you</h1>
            <p className="mt-1 text-muted-foreground">
              Your gift of <b className="num text-foreground">GHS {amount}</b>{fund ? <> to <b className="text-foreground">{fund}</b></> : null} was received. God bless your generosity.
            </p>
          </>
        ) : (
          <>
            <span className="mx-auto mt-4 grid h-14 w-14 place-items-center rounded-full bg-red-500/10"><XCircle className="h-8 w-8 text-red-500" /></span>
            <h1 className="mt-3 text-2xl font-semibold">Payment not completed</h1>
            <p className="mt-1 text-muted-foreground">
              {reference ? "The transaction wasn't successful. No charge was made — please try again." : "No payment reference was found."}
            </p>
          </>
        )}
        <div className="mt-6 flex gap-3">
          <Link href="/donate" className="flex-1 rounded-full border border-border py-3 text-sm font-semibold transition-colors hover:bg-secondary">Give again</Link>
          <Link href="/" className="glow-primary flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-deep">Back home</Link>
        </div>
      </div>
    </div>
  );
}
