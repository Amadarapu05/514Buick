"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, Search, X } from "lucide-react";
import type { SpotifyQueueTrack } from "@/lib/spotify/queue";
import { getSpotifyRedirectUri } from "@/lib/spotify/redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Track {
  id: string;
  name: string;
  artist: string;
  albumArt?: string;
}

interface NowPlaying {
  playing: boolean;
  track: Track | null;
}

async function parseJsonResponse(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export function MusicDashboard({
  isHost,
  spotifyConnected,
}: {
  isHost: boolean;
  spotifyConnected: boolean;
}) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [queue, setQueue] = useState<SpotifyQueueTrack[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    if (spotifyConnected || !isHost) {
      setConnectUrl(null);
      return;
    }
    const redirectUri = getSpotifyRedirectUri(window.location.origin);
    setConnectUrl(
      `https://accounts.spotify.com/authorize?${new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "",
        response_type: "code",
        redirect_uri: redirectUri,
        scope:
          "user-read-playback-state user-modify-playback-state playlist-read-private playlist-modify-public",
      })}`
    );
  }, [spotifyConnected, isHost]);

  const loadQueue = useCallback(async () => {
    if (!spotifyConnected) {
      setQueue([]);
      return;
    }
    const res = await fetch("/api/spotify/queue");
    const data = await parseJsonResponse(res);
    setQueue(data.items ?? []);
  }, [spotifyConnected]);

  const loadNowPlaying = useCallback(async () => {
    const res = await fetch("/api/spotify/now-playing");
    const data = await parseJsonResponse(res);
    setNowPlaying(data);
  }, []);

  useEffect(() => {
    if (!spotifyConnected) return;
    loadQueue();
    loadNowPlaying();
    const interval = setInterval(() => {
      loadQueue();
      loadNowPlaying();
    }, 3000);
    return () => clearInterval(interval);
  }, [spotifyConnected, loadQueue, loadNowPlaying]);

  useEffect(() => {
    if (!query.trim() || !spotifyConnected) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await parseJsonResponse(res);
      setResults(data.tracks ?? []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, spotifyConnected]);

  async function addToQueue(track: Track) {
    const res = await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotify_track_id: track.id }),
    });
    if (!res.ok) {
      const data = await parseJsonResponse(res);
      showToast(data.error ?? "Failed to add");
      return;
    }
    showToast(`Added "${track.name}"`);
    setQuery("");
    setResults([]);
    loadQueue();
  }

  async function removeFromQueue(index: number, trackName: string) {
    setRemovingIndex(index);
    const res = await fetch(`/api/spotify/queue?index=${index}`, {
      method: "DELETE",
    });
    setRemovingIndex(null);
    if (!res.ok) {
      const data = await parseJsonResponse(res);
      showToast(data.error ?? "Could not remove song");
      return;
    }
    showToast(`Removed "${trackName}"`);
    loadQueue();
  }

  return (
    <div className="space-y-10">
      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
        >
          <div className="mx-auto max-w-lg px-4 pt-4">
            <div className="rounded-lg border border-accent/40 bg-accent px-4 py-3 text-center text-sm font-medium text-accent-foreground shadow-lg">
              {toast}
            </div>
          </div>
        </div>
      )}

      {!spotifyConnected && isHost && connectUrl && (
        <div className="rounded-lg border border-accent/50 bg-accent/10 p-4">
          <p className="text-sm">
            Connect the apartment Spotify account (Premium required).
          </p>
          <a
            href={connectUrl}
            className="mt-3 inline-flex h-10 items-center rounded-md bg-[#1DB954] px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Connect Spotify
          </a>
        </div>
      )}

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Music2 className="h-5 w-5 text-accent" />
          Now playing
        </h2>
        {nowPlaying?.track ? (
          <div className="flex items-center gap-4">
            {nowPlaying.track.albumArt && (
              <Image
                src={nowPlaying.track.albumArt}
                alt=""
                width={80}
                height={80}
                className="rounded-md"
              />
            )}
            <div>
              <p className="font-medium">{nowPlaying.track.name}</p>
              <p className="text-muted-foreground">{nowPlaying.track.artist}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {spotifyConnected
              ? "Nothing playing — start Spotify on the apartment speaker."
              : "Spotify not connected."}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Search className="h-5 w-5" />
          Add a song
        </h2>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tracks…"
          disabled={!spotifyConnected}
        />
        {searching && (
          <p className="mt-2 text-sm text-muted-foreground">Searching…</p>
        )}
        <ul className="mt-4 space-y-2">
          {results.map((track) => (
            <li
              key={track.id}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div className="flex items-center gap-3">
                {track.albumArt && (
                  <Image
                    src={track.albumArt}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded"
                  />
                )}
                <div>
                  <p className="font-medium">{track.name}</p>
                  <p className="text-sm text-muted-foreground">{track.artist}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addToQueue(track)}
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Apartment queue</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Up next on Spotify — updates live.
        </p>
        <ul className="space-y-2">
          {queue.slice(0, 10).map((item, i) => (
            <li
              key={`${item.id}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <span className="w-6 text-center text-sm text-muted-foreground">
                {i + 1}
              </span>
              {item.albumArt && (
                <Image
                  src={item.albumArt}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {item.artist}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFromQueue(i, item.name)}
                disabled={removingIndex === i}
                aria-label={`Remove ${item.name} from queue`}
                className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {queue.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03]">
                <Music2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground/80">Queue is empty</p>
              <p className="text-sm text-muted-foreground">
                Search above to add the first song.
              </p>
            </div>
          )}
        </ul>
      </section>
    </div>
  );
}
