"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Rsvp, RsvpStatus, EventStatus } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RsvpSectionProps {
  eventId: string;
  userRsvp: Rsvp | null;
  isLoggedIn: boolean;
  eventStatus: EventStatus;
}

export function RsvpSection({
  eventId,
  userRsvp: initialUserRsvp,
  isLoggedIn: initialLoggedIn,
  eventStatus,
}: RsvpSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [userRsvp, setUserRsvp] = useState<Rsvp | null>(initialUserRsvp);
  const [authReady, setAuthReady] = useState(initialLoggedIn);
  const [status, setStatus] = useState<RsvpStatus>(
    initialUserRsvp?.status ?? "going"
  );
  const [notes, setNotes] = useState(initialUserRsvp?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function syncAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const loggedIn = !!user;
      setIsLoggedIn(loggedIn);
      setAuthReady(true);

      if (!user) {
        setUserRsvp(null);
        return;
      }

      const { data: rsvp } = await supabase
        .from("rsvps")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      setUserRsvp(rsvp);
      if (rsvp) {
        setStatus(rsvp.status);
        setNotes(rsvp.notes ?? "");
      }
    }

    syncAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncAuth();
    });

    return () => subscription.unsubscribe();
  }, [eventId]);

  if (eventStatus === "past" || eventStatus === "draft") {
    return (
      <p className="text-muted-foreground">
        {eventStatus === "past"
          ? "This event has passed."
          : "RSVP is not open for this event."}
      </p>
    );
  }

  if (!authReady) {
    return <p className="text-sm text-muted-foreground">Loading RSVP…</p>;
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(pathname)}`}
        className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        Sign in to RSVP
      </Link>
    );
  }

  async function saveRsvp(newStatus: RsvpStatus) {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (newStatus === "cancelled") {
      if (userRsvp) {
        await supabase.from("rsvps").delete().eq("id", userRsvp.id);
      }
      setMessage("RSVP cancelled.");
      router.refresh();
      setLoading(false);
      return;
    }

    const payload = {
      event_id: eventId,
      user_id: user.id,
      status: newStatus,
      notes: notes || null,
    };

    if (userRsvp) {
      await supabase.from("rsvps").update(payload).eq("id", userRsvp.id);
    } else {
      await supabase.from("rsvps").insert(payload);
    }

    setStatus(newStatus);
    setMessage("You're on the list!");
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["going", "maybe"] as const).map((s) => (
          <Button
            key={s}
            variant={status === s ? "accent" : "outline"}
            disabled={loading}
            onClick={() => saveRsvp(s)}
          >
            {s === "going" ? "Going" : "Maybe"}
          </Button>
        ))}
        {userRsvp && (
          <Button
            variant="ghost"
            disabled={loading}
            onClick={() => saveRsvp("cancelled")}
          >
            Cancel RSVP
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (dietary, etc.)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          rows={2}
        />
        {userRsvp && (
          <Button
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => saveRsvp(status)}
          >
            Update notes
          </Button>
        )}
      </div>
      {message && <p className="text-sm text-accent">{message}</p>}
    </div>
  );
}
