import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchSpotifyQueue,
  removeFromSpotifyQueueAtIndex,
} from "@/lib/spotify/queue";

export async function GET() {
  try {
    const items = await fetchSpotifyQueue();
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not load queue";
    return NextResponse.json({ items: [], error: msg });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to manage the queue" }, { status: 401 });
  }

  const index = Number(new URL(request.url).searchParams.get("index"));
  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Invalid queue position" }, { status: 400 });
  }

  try {
    await removeFromSpotifyQueueAtIndex(index);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not remove from queue";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
