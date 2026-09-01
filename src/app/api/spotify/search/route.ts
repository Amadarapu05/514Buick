import { NextResponse } from "next/server";
import { spotifyFetch } from "@/lib/spotify/client";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const data = await spotifyFetch(
      `/search?${new URLSearchParams({ q, type: "track", limit: "8" })}`
    );
    const tracks = (data.tracks?.items ?? []).map(
      (t: {
        id: string;
        name: string;
        artists: { name: string }[];
        album: { images: { url: string }[] };
      }) => ({
        id: t.id,
        name: t.name,
        artist: t.artists.map((a) => a.name).join(", "),
        albumArt: t.album.images[0]?.url,
      })
    );
    return NextResponse.json({ tracks });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
