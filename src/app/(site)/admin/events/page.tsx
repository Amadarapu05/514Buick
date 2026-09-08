import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatEventDate } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { DeleteEventButton } from "@/components/admin/delete-event-button";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "host") redirect("/");

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Events</h1>
        <Link href="/admin/events/new">
          <Button variant="accent">New event</Button>
        </Link>
      </div>
      <ul className="space-y-3">
        {events?.map((event) => (
          <li
            key={event.id}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div>
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatEventDate(event.starts_at, "MMM d, yyyy · h:mm a")} ·{" "}
                <span className="capitalize">{event.status}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/events/${event.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
              <Link href={`/admin/events/${event.id}/rsvps`}>
                <Button variant="ghost" size="sm">
                  RSVPs
                </Button>
              </Link>
              <DeleteEventButton eventId={event.id} eventTitle={event.title} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
