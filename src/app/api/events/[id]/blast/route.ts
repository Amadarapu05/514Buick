import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/spotify/redirect";
import { sendSmsBlast } from "@/lib/twilio";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "host") {
    return NextResponse.json({ error: "Hosts only" }, { status: 403 });
  }

  const body = await request.json();
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 1 || message.length > 320) {
    return NextResponse.json(
      { error: "Message must be 1–320 characters." },
      { status: 400 }
    );
  }

  const service = await createServiceClient();
  const { data: event } = await service
    .from("events")
    .select("id, title, slug")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: rsvps } = await service
    .from("rsvps")
    .select("phone, guest_name, status")
    .eq("event_id", eventId)
    .in("status", ["going", "maybe"])
    .not("phone", "is", null);

  const phones = [
    ...new Set(
      (rsvps ?? [])
        .map((r) => r.phone)
        .filter((p): p is string => typeof p === "string" && p.length > 0)
    ),
  ];

  if (phones.length === 0) {
    return NextResponse.json(
      { error: "No phone numbers on the guest list yet." },
      { status: 400 }
    );
  }

  const eventUrl = `${getAppOrigin()}/events/${event.slug}`;
  const smsBody = `514 Buick — ${event.title}\n\n${message}\n\nEvent: ${eventUrl}\n\nReply STOP to opt out, HELP for help.`;

  try {
    const result = await sendSmsBlast(phones, smsBody);
    return NextResponse.json({
      ok: true,
      recipients: phones.length,
      ...result,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send texts";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
