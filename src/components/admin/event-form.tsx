"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Event, EventStatus } from "@/lib/types/database";
import { slugify } from "@/lib/utils";
import { DeleteEventButton } from "@/components/admin/delete-event-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventFormProps {
  event?: Event;
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startsAt, setStartsAt] = useState(
    event?.starts_at
      ? new Date(event.starts_at).toISOString().slice(0, 16)
      : ""
  );
  const [status, setStatus] = useState<EventStatus>(event?.status ?? "draft");
  const [coverUrl, setCoverUrl] = useState(event?.cover_image_url ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const slug = event?.slug ?? slugify(title);
    const payload = {
      title,
      slug,
      description: description || null,
      starts_at: new Date(startsAt).toISOString(),
      status,
      cover_image_url: coverUrl || null,
      created_by: user.id,
    };

    if (event) {
      const { error: err } = await supabase
        .from("events")
        .update(payload)
        .eq("id", event.id);
      if (err) setError(err.message);
      else router.push(`/admin/events/${event.id}/rsvps`);
    } else {
      const { error: err } = await supabase.from("events").insert(payload);
      if (err) setError(err.message);
      else router.push("/admin/events");
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="startsAt">Date & time</Label>
        <Input
          id="startsAt"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coverUrl">Cover image URL</Label>
        <Input id="coverUrl" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as EventStatus)}
          className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="past">Past</option>
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : event ? "Update event" : "Create event"}
        </Button>
        {event && (
          <DeleteEventButton eventId={event.id} eventTitle={event.title} size="default" />
        )}
      </div>
    </form>
  );
}
