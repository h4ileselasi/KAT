import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
// @ts-ignore - JS module
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Paystack calls this on payment events. It signs the body with your secret key
// (HMAC-SHA512) in the x-paystack-signature header. Configure the URL in
// Paystack Dashboard → Settings → API Keys & Webhooks (needs a public URL).
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(raw)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    if (reference) {
      await supabaseAdmin.from("donations").update({ status: "success" }).eq("reference", reference);
    }
  }
  return NextResponse.json({ received: true });
}
