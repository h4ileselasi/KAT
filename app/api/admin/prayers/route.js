import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function guard() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// DELETE with { id } removes one intention; with { reset: true } clears the wall.
export async function DELETE(req) {
  const blocked = await guard();
  if (blocked) return blocked;
  const body = await req.json();

  if (body.reset) {
    // Clear the entire prayer wall (the "reset function" from the plan)
    const { error } = await supabaseAdmin.from("prayer_wall").delete().neq("id", 0);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, reset: true });
  }

  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await supabaseAdmin.from("prayer_wall").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
