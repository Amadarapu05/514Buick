import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VENUE_ADDRESS } from "@/lib/utils";

export async function GET() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: event } = await supabase
    .from("events")
    .select("title, starts_at")
    .eq("status", "published")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ event: null });
  }

  const starts = new Date(event.starts_at).getTime();
  const diff = starts - Date.now();

  return NextResponse.json({
    event: {
      title: event.title,
      location: VENUE_ADDRESS,
      starts_at: event.starts_at,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
    },
  });
}
