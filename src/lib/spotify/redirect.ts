/** Canonical app origin for OAuth redirects (avoids localhost vs 127.0.0.1 mismatch). */
export function getAppOrigin(requestOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (requestOrigin) return requestOrigin;
  return "http://127.0.0.1:3000";
}

export function getSpotifyRedirectUri(requestOrigin?: string): string {
  return `${getAppOrigin(requestOrigin)}/api/spotify/callback`;
}
