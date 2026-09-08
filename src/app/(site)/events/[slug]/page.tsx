import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VENMO_URL, VENUE_ADDRESS, cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/datetime";
import { getGoogleCalendarUrl } from "@/lib/calendar";
import { RsvpSection } from "@/components/rsvp-section";
import {
  RsvpListDialog,
  type PublicRsvpEntry,
} from "@/components/rsvp-list-dialog";
import { buttonVariants } from "@/components/ui/button";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!event) notFound();

  const { data: images } = await supabase
    .from("event_images")
    .select("url, sort_order")
    .eq("event_id", event.id)
    .order("sort_order");

  const { count: goingCount } = await supabase
    .from("rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("status", "going");

  const { count: maybeCount } = await supabase
    .from("rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("status", "maybe");

  const { data: rsvpRows } = await supabase
    .from("rsvps")
    .select("id, status, guest_name, profiles(display_name, email)")
    .eq("event_id", event.id)
    .in("status", ["going", "maybe"]);

  const publicRsvps: PublicRsvpEntry[] = (rsvpRows ?? [])
    .map((row) => {
      const raw = row.profiles;
      const profile = Array.isArray(raw) ? raw[0] : raw;
      const displayName =
        row.guest_name?.trim() ||
        (profile as { display_name: string | null } | null)?.display_name?.trim() ||
        (profile as { email: string } | null)?.email?.split("@")[0] ||
        "Guest";
      return {
        id: row.id,
        status: row.status as "going" | "maybe",
        displayName,
      };
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "going" ? -1 : 1;
      return a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
      });
    });

  const showGuestList =
    event.status === "published" || event.status === "past";

  const heroUrl =
    images?.[0]?.url ?? event.cover_image_url ?? PLACEHOLDER;
  const dateStr = formatEventDate(
    event.starts_at,
    "EEEE, MMMM d, yyyy · h:mm a"
  );
  const googleCalUrl = getGoogleCalendarUrl({
    title: event.title,
    slug: event.slug,
    description: event.description,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
  });

  return (
    <article>
      <div className="relative h-[50vh] min-h-[320px] w-full">
        <Image
          src={heroUrl}
          alt={event.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          {dateStr}
        </p>
        <h1 className="font-display mt-2 text-4xl font-bold md:text-5xl">
          {event.title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">{VENUE_ADDRESS}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={VENMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "accent" }))}
          >
            $ Donate
          </a>
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Add to calendar
          </a>
        </div>
        {event.description && (
          <p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed">
            {event.description}
          </p>
        )}
        {images && images.length > 1 && (
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
            {images.slice(1).map((img) => (
              <div
                key={img.url}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="300px"
                />
              </div>
            ))}
          </div>
        )}
        <div className="mt-10 border-t border-border pt-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-muted-foreground">
              {goingCount ?? 0} going
              {(maybeCount ?? 0) > 0 && ` · ${maybeCount} maybe`}
            </p>
            {showGuestList && (
              <RsvpListDialog
                rsvps={publicRsvps}
                goingCount={goingCount ?? 0}
                maybeCount={maybeCount ?? 0}
              />
            )}
          </div>
          <RsvpSection eventId={event.id} eventStatus={event.status} />
        </div>
      </div>
    </article>
  );
}
