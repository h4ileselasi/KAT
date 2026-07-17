import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function guard() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// Update the single live_stream_config row (id = 1).
export async function PATCH(req) {
  const blocked = await guard();
  if (blocked) return blocked;
  const fields = await req.json();
  delete fields.id; // never let the id be changed
  fields.updated_at = new Date().toISOString();

  // Going live starts a fresh chat session: stamp the transition moment so
  // the public chat only shows messages from this service onward.
  const { data: current } = await supabaseAdmin
    .from("live_stream_config")
    .select("is_live")
    .eq("id", 1)
    .single();
  if (fields.is_live === true && current && !current.is_live) {
    fields.session_started_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("live_stream_config")
    .update(fields)
    .eq("id", 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
