const SPOTIFY_API = "https://api.spotify.com/v1";

export async function getSpotifyAccessToken(): Promise<string | null> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = await createServiceClient();
  const { data } = await supabase.from("spotify_tokens").select("*").eq("id", 1).single();

  if (!data) return null;

  if (new Date(data.expires_at) > new Date(Date.now() + 60_000)) {
    return data.access_token;
  }

  const refreshed = await refreshToken(data.refresh_token);
  if (!refreshed) return null;

  await supabase.from("spotify_tokens").upsert({
    id: 1,
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token ?? data.refresh_token,
    expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });

  return refreshed.access_token;
}

async function refreshToken(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

export async function spotifyFetch(path: string, options: RequestInit = {}) {
  const token = await getSpotifyAccessToken();
  if (!token) throw new Error("Spotify not connected");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> | undefined),
  };
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${SPOTIFY_API}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }

  if (res.status === 204 || res.status === 205) return null;

  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
