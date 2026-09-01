import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EventRsvpsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", id)
    .single();
  if (!event) notFound();

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("*, profiles(display_name, email)")
    .eq("event_id", id)
    .neq("status", "cancelled");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-foreground">
        ← Events
      </Link>
      <h1 className="font-display mt-4 text-3xl font-bold">RSVPs</h1>
      <p className="text-muted-foreground">{event.title}</p>
      <ul className="mt-8 space-y-3">
        {rsvps && rsvps.length > 0 ? (
          rsvps.map((rsvp) => {
            const p = rsvp.profiles as { display_name: string | null; email: string } | null;
            return (
              <li
                key={rsvp.id}
                className="rounded-lg border border-border p-4"
              >
                <p className="font-medium">
                  {p?.display_name ?? p?.email ?? "Guest"}
                </p>
                <p className="text-sm capitalize text-muted-foreground">
                  {rsvp.status}
                  {rsvp.notes ? ` · ${rsvp.notes}` : ""}
                </p>
              </li>
            );
          })
        ) : (
          <p className="text-muted-foreground">No RSVPs yet.</p>
        )}
      </ul>
    </div>
  );
}
