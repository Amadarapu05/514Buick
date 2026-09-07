"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function buildSmsBody(eventTitle: string, message: string) {
  return `514 Buick — ${eventTitle}\n\n${message.trim()}`;
}

function buildSmsLink(phones: string[], body: string) {
  const encoded = encodeURIComponent(body);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (phones.length === 0) {
    return isIOS ? `sms:&body=${encoded}` : `sms:?body=${encoded}`;
  }

  // Strip + for broader client compatibility
  const addresses = phones.map((p) => p.replace(/^\+/, "")).join(",");

  if (isIOS) {
    return `sms:/open?addresses=${addresses}&body=${encoded}`;
  }
  return `sms:${addresses}?body=${encoded}`;
}

export function TextBlastForm({
  eventTitle,
  phones,
}: {
  eventTitle: string;
  phones: string[];
}) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recipientCount = phones.length;
  const fullBody = buildSmsBody(eventTitle, message || " ");

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied.`);
      setError(null);
    } catch {
      setError(`Could not copy ${label.toLowerCase()}.`);
    }
  }

  async function openFromPhone() {
    if (!message.trim()) return;
    setError(null);

    const body = buildSmsBody(eventTitle, message);
    const phoneList = phones.join(", ");

    try {
      await navigator.clipboard.writeText(
        `${body}\n\n—\nPhones (${phones.length}):\n${phoneList}`
      );
    } catch {
      // Clipboard may fail on some browsers; still try to open SMS
    }

    const link = buildSmsLink(phones, body);
    window.location.href = link;
    setStatus(
      phones.length > 0
        ? `Opening Messages with ${phones.length} recipient${phones.length === 1 ? "" : "s"}. Message copied to clipboard too — paste if the body didn’t fill in.`
        : "Opening Messages. Message copied to clipboard."
    );
  }

  return (
    <div className="mt-10 rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold">Text blast</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Sends from <span className="text-foreground">your phone</span> — we
        open Messages and copy the text. Going + maybe with a phone:{" "}
        {recipientCount} recipient{recipientCount === 1 ? "" : "s"}.
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
          {message.length}/320 · Prefixed with event title automatically
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="accent"
          disabled={!message.trim() || recipientCount === 0}
          onClick={openFromPhone}
        >
          Open Messages
        </Button>
        <Button
          variant="outline"
          disabled={!message.trim()}
          onClick={() =>
            copyText(buildSmsBody(eventTitle, message), "Message")
          }
        >
          Copy message
        </Button>
        <Button
          variant="outline"
          disabled={recipientCount === 0}
          onClick={() => copyText(phones.join(", "), "Phone numbers")}
        >
          Copy phones
        </Button>
      </div>

      {recipientCount === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No phone numbers on the guest list yet.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {status && <p className="mt-3 text-sm text-accent">{status}</p>}

      {recipientCount > 0 && (
        <details className="mt-4 text-sm text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            Preview ({recipientCount} numbers)
          </summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-xs">
            {fullBody.trim() || "(enter a message)"}
            {"\n\n"}
            {phones.join("\n")}
          </pre>
        </details>
      )}
    </div>
  );
}
