import { NextRequest, NextResponse } from "next/server";
// @ts-ignore - JS module
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { amount, fund, email, recurring } = await req.json();

  const cedis = parseInt(amount, 10);
  if (!email || !cedis || cedis < 1) {
    return NextResponse.json({ error: "A valid email and amount are required." }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: cedis * 100, // Paystack uses the minor unit (pesewas)
      currency: "GHS",
      channels: ["mobile_money", "card"],
      callback_url: `${origin}/donate/callback`,
      metadata: {
        fund: fund || "Offering",
        recurring: !!recurring,
        custom_fields: [{ display_name: "Fund", variable_name: "fund", value: fund || "Offering" }],
      },
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message || "Could not start payment." }, { status: 502 });
  }

  // Record a pending donation so we can reconcile later.
  await supabaseAdmin.from("donations").insert({
    reference: data.data.reference,
    email,
    amount: cedis,
    fund: fund || "Offering",
    recurring: !!recurring,
    status: "pending",
  });

  return NextResponse.json({ authorization_url: data.data.authorization_url });
}
