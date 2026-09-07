import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MusicDashboard } from "@/components/music/music-dashboard";

export default async function MusicPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isHost = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isHost = profile?.role === "host";
  }

  let spotifyConnected = false;
  try {
    const service = await createServiceClient();
    const { data } = await service.from("spotify_tokens").select("id").eq("id", 1).maybeSingle();
    spotifyConnected = !!data;
  } catch {
    spotifyConnected = false;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Apartment Queue</h1>
      <p className="mt-2 text-muted-foreground">
        Add songs to the apartment queue at 514 Buick.
      </p>
      <div className="mt-10">
        <MusicDashboard
          isHost={isHost}
          spotifyConnected={spotifyConnected}
        />
      </div>
    </div>
  );
}
