import { NextResponse } from "next/server";
import { spotifyFetch } from "@/lib/spotify/client";

export async function GET() {
  try {
    const data = await spotifyFetch("/me/player/currently-playing");
    if (!data) {
      return NextResponse.json({ playing: false });
    }
    const item = data.item;
    return NextResponse.json({
      playing: data.is_playing,
      track: item
        ? {
            id: item.id,
            name: item.name,
            artist: item.artists?.map((a: { name: string }) => a.name).join(", "),
            albumArt: item.album?.images?.[0]?.url,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ playing: false, error: "not_connected" });
  }
}
