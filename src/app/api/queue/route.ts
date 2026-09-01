import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addTrackToSpotifyQueue } from "@/lib/spotify/queue";

function spotifyQueueErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; reason?: string };
    };
    if (parsed.error?.reason === "NO_ACTIVE_DEVICE") {
      return "No active Spotify device. Open Spotify on the TV/speaker and press play first.";
    }
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    if (raw.includes("NO_ACTIVE_DEVICE")) {
      return "No active Spotify device. Open Spotify on the TV/speaker and press play first.";
    }
  }
  return raw || "Could not add to Spotify queue.";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to add songs" }, { status: 401 });
  }

  const body = await request.json();
  const { spotify_track_id } = body;

  if (!spotify_track_id) {
    return NextResponse.json({ error: "Invalid track" }, { status: 400 });
  }

  try {
    await addTrackToSpotifyQueue(spotify_track_id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Spotify queue failed";
    return NextResponse.json(
      { error: spotifyQueueErrorMessage(msg) },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
