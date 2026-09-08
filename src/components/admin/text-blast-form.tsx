"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function TextBlastForm({
  eventId,
  recipientCount,
}: {
  eventId: string;
  recipientCount: number;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendBlast() {
    if (
      !confirm(
        `Send this text via Twilio to ${recipientCount} guest${recipientCount === 1 ? "" : "s"} (going + maybe)?`
      )
    ) {
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const res = await fetch(`/api/events/${eventId}/blast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to send");
      return;
    }

    const failNote =
      data.failed?.length > 0 ? ` (${data.failed.length} failed)` : "";
    setResult(`Sent to ${data.sent} of ${data.recipients}${failNote}.`);
    setMessage("");
  }

  return (
    <div className="mt-10 rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold">Text blast</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Sends via Twilio to everyone with status Going or Maybe who left a
        phone number ({recipientCount} recipient
        {recipientCount === 1 ? "" : "s"}).
      </p>
      <div className="mt-4 space-y-2">
        <Label htmlFor="blast">Message</Label>
        <Textarea
          id="blast"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Doors at 9 — bring a drink if you can!"
          rows={4}
          maxLength={320}
        />
        <p className="text-xs text-muted-foreground">
          {message.length}/320 · Event link + STOP/HELP footer added
          automatically
        </p>
      </div>
      <Button
        className="mt-4"
        variant="accent"
        disabled={loading || !message.trim() || recipientCount === 0}
        onClick={sendBlast}
      >
        {loading ? "Sending…" : "Send text blast"}
      </Button>
      {recipientCount === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No phone numbers on the guest list yet.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {result && <p className="mt-3 text-sm text-accent">{result}</p>}
    </div>
  );
}
