import { spotifyFetch } from "@/lib/spotify/client";

export interface SpotifyQueueTrack {
  id: string;
  name: string;
  artist: string;
  albumArt?: string;
  uri: string;
}

type SpotifyTrackObject = {
  id: string;
  name: string;
  uri: string;
  artists?: { name: string }[];
  album?: { images?: { url: string }[] };
};

function mapQueueTrack(item: SpotifyTrackObject): SpotifyQueueTrack {
  return {
    id: item.id,
    name: item.name,
    artist: item.artists?.map((a) => a.name).join(", ") ?? "",
    albumArt: item.album?.images?.[0]?.url,
    uri: item.uri,
  };
}

export async function addTrackToSpotifyQueue(spotifyTrackId: string) {
  await spotifyFetch(
    `/me/player/queue?${new URLSearchParams({
      uri: `spotify:track:${spotifyTrackId}`,
    })}`,
    { method: "POST" }
  );
}

export async function fetchSpotifyQueue(): Promise<SpotifyQueueTrack[]> {
  const data = await spotifyFetch("/me/player/queue");
  if (!data?.queue?.length) return [];
  return (data.queue as SpotifyTrackObject[]).map(mapQueueTrack);
}

export async function removeFromSpotifyQueueAtIndex(index: number) {
  const queueData = await spotifyFetch("/me/player/queue");
  const queue = (queueData?.queue ?? []) as SpotifyTrackObject[];
  const currentlyPlaying = queueData?.currently_playing as
    | SpotifyTrackObject
    | undefined;

  if (index < 0 || index >= queue.length) {
    throw new Error("Invalid queue position");
  }

  const remainingUris = queue
    .filter((_, i) => i !== index)
    .map((track) => track.uri);

  let playback: {
    is_playing?: boolean;
    progress_ms?: number;
    device?: { id?: string };
  } | null = null;

  try {
    playback = await spotifyFetch("/me/player");
  } catch {
    playback = null;
  }

  const deviceId = playback?.device?.id;
  const deviceQuery = deviceId ? `?device_id=${deviceId}` : "";

  if (currentlyPlaying) {
    const uris = [currentlyPlaying.uri, ...remainingUris];
    const positionMs = playback?.progress_ms ?? 0;
    await spotifyFetch(`/me/player/play${deviceQuery}`, {
      method: "PUT",
      body: JSON.stringify({ uris, position_ms: positionMs }),
    });
    return;
  }

  if (remainingUris.length === 0) {
    throw new Error("Nothing to play");
  }

  await spotifyFetch(`/me/player/play${deviceQuery}`, {
    method: "PUT",
    body: JSON.stringify({ uris: remainingUris }),
  });
}
