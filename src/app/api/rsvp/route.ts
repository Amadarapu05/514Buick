import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { buildRsvpConfirmationSms } from "@/lib/calendar";
import { getTwilioClient, sendSms } from "@/lib/twilio";
import type { RsvpStatus } from "@/lib/types/database";

export async function POST(request: Request) {
  const body = await request.json();
  const eventId = typeof body.event_id === "string" ? body.event_id : "";
  const guestName =
    typeof body.guest_name === "string" ? body.guest_name.trim() : "";
  const phoneRaw = typeof body.phone === "string" ? body.phone : "";
  const status = body.status as RsvpStatus;
  const notes =
    typeof body.notes === "string" ? body.notes.trim() || null : null;

  if (!eventId || !guestName) {
    return NextResponse.json(
      { error: "Name and event are required." },
      { status: 400 }
    );
  }

  if (!["going", "maybe", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const phone = normalizePhone(phoneRaw);
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid US phone number." },
      { status: 400 }
    );
  }

  const service = await createServiceClient();

  const { data: event } = await service
    .from("events")
    .select("id, status, title, slug, description, starts_at, ends_at")
    .eq("id", eventId)
    .single();

  if (!event || event.status !== "published") {
    return NextResponse.json(
      { error: "RSVP is not open for this event." },
      { status: 400 }
    );
  }

  const { data: existing } = await service
    .from("rsvps")
    .select("id")
    .eq("event_id", eventId)
    .eq("phone", phone)
    .maybeSingle();

  if (status === "cancelled") {
    if (existing) {
      await service.from("rsvps").delete().eq("id", existing.id);
    }
    return NextResponse.json({ ok: true, cancelled: true });
  }

  const payload = {
    event_id: eventId,
    guest_name: guestName,
    phone,
    status,
    notes,
    user_id: null as string | null,
    updated_at: new Date().toISOString(),
  };

  let rsvp;
  if (existing) {
    const { data, error } = await service
      .from("rsvps")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    rsvp = data;
  } else {
    const { data, error } = await service
      .from("rsvps")
      .insert(payload)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    rsvp = data;
  }

  // Confirmation SMS — don't fail the RSVP if Twilio errors
  let smsSent = false;
  if (getTwilioClient() && (status === "going" || status === "maybe")) {
    try {
      const smsBody = buildRsvpConfirmationSms({
        title: event.title,
        slug: event.slug,
        description: event.description,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        status,
      });
      await sendSms(phone, smsBody);
      smsSent = true;
    } catch (e) {
      console.error("RSVP confirmation SMS failed:", e);
    }
  }

  return NextResponse.json({ rsvp, smsSent });
}
