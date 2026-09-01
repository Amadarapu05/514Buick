import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAppOrigin, getSpotifyRedirectUri } from "@/lib/spotify/redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appOrigin = getAppOrigin(origin);

  if (error || !code) {
    return NextResponse.redirect(`${appOrigin}/music?error=spotify_denied`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = getSpotifyRedirectUri(origin);

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appOrigin}/music?error=token_failed`);
  }

  const tokens = await tokenRes.json();
  const supabase = await createServiceClient();

  await supabase.from("spotify_tokens").upsert({
    id: 1,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(`${appOrigin}/music?connected=1`);
}
