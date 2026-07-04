import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
// @ts-ignore - JS module
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function guard() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function POST(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;
  const { image_url, caption } = await req.json();
  if (!image_url) return NextResponse.json({ error: "An image is required" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("gallery")
    .insert({ image_url, caption: caption || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await supabaseAdmin.from("gallery").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
