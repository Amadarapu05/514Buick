"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ConfessionCategory } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ConfessionForm() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<ConfessionCategory>("confession");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 3) {
      setError("Write something first.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/confessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim(), category }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setBody("");
    setDone(true);
    router.refresh();
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-6">
      <div className="space-y-2">
        <Label htmlFor="category">Type</Label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ConfessionCategory)}
          className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
        >
          <option value="confession">Confession</option>
          <option value="feedback">Feedback</option>
          <option value="suggestion">Suggestion</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Your message (anonymous)</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Say what’s on your mind…"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">{body.length}/500</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {done && <p className="text-sm text-accent">Posted anonymously.</p>}
      <Button type="submit" variant="accent" disabled={loading}>
        {loading ? "Posting…" : "Post anonymously"}
      </Button>
    </form>
  );
}
