"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EventStatus, RsvpStatus } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RsvpSectionProps {
  eventId: string;
  eventStatus: EventStatus;
}

export function RsvpSection({ eventId, eventStatus }: RsvpSectionProps) {
  const router = useRouter();
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<RsvpStatus>("going");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (eventStatus === "past" || eventStatus === "draft") {
    return (
      <p className="text-muted-foreground">
        {eventStatus === "past"
          ? "This event has passed."
          : "RSVP is not open for this event."}
      </p>
    );
  }

  async function saveRsvp(newStatus: RsvpStatus) {
    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        guest_name: guestName,
        phone,
        status: newStatus,
        notes,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save RSVP");
      return;
    }

    if (newStatus === "cancelled") {
      setMessage("RSVP cancelled.");
    } else {
      setStatus(newStatus);
      setMessage(
        newStatus === "going"
          ? "You're on the list! Check your texts for a confirmation + calendar link."
          : "Got it — marked as maybe. Check your texts for details."
      );
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="guestName">Name</Label>
          <Input
            id="guestName"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Your name"
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(617) 555-1234"
            required
            autoComplete="tel"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        By RSVPing you agree to receive event texts from 514 Buick about this
        party.
      </p>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (dietary, etc.)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          rows={2}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={status === "going" ? "accent" : "outline"}
          disabled={loading || !guestName.trim() || !phone.trim()}
          onClick={() => saveRsvp("going")}
        >
          Going
        </Button>
        <Button
          variant={status === "maybe" ? "accent" : "outline"}
          disabled={loading || !guestName.trim() || !phone.trim()}
          onClick={() => saveRsvp("maybe")}
        >
          Maybe
        </Button>
        <Button
          variant="ghost"
          disabled={loading || !guestName.trim() || !phone.trim()}
          onClick={() => saveRsvp("cancelled")}
        >
          Cancel RSVP
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-accent">{message}</p>}
    </div>
  );
}
