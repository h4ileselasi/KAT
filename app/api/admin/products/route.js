import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function guard() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req) {
  const blocked = await guard();
  if (blocked) return blocked;
  const { name, price, image_url, tag } = await req.json();
  if (!name || price == null) return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({ name, price: parseInt(price, 10), image_url: image_url || null, tag: tag || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req) {
  const blocked = await guard();
  if (blocked) return blocked;
  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (fields.price != null) fields.price = parseInt(fields.price, 10);
  const { data, error } = await supabaseAdmin.from("products").update(fields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req) {
  const blocked = await guard();
  if (blocked) return blocked;
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
