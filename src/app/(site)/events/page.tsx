import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/event-card";
import { EventsTabs } from "@/components/events-tabs";
import { ScrollReveal } from "@/components/scroll-reveal";
import { VENUE_ADDRESS } from "@/lib/utils";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "upcoming" } = await searchParams;
  const supabase = await createClient();
  const now = new Date().toISOString();

  let query = supabase.from("events").select("*");

  if (tab === "past") {
    query = query
      .in("status", ["past", "published"])
      .lt("starts_at", now)
      .order("starts_at", { ascending: false });
  } else {
    query = query
      .eq("status", "published")
      .gte("starts_at", now)
      .order("starts_at", { ascending: true });
  }

  const { data: events } = await query;

  const featuredEvent = tab === "upcoming" ? events?.[0] : null;
  const listEvents =
    tab === "upcoming" ? (events?.slice(1) ?? []) : (events ?? []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Page header */}
      <div className="animate-fade-in-up mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent/70">
          514 Buick
        </p>
        <h1 className="font-display text-4xl font-bold md:text-5xl">Events</h1>
        <div
          className="mt-3 h-px w-12"
          style={{ background: "linear-gradient(90deg, #c9a227, transparent)" }}
          aria-hidden
        />
        <p className="mt-3 text-muted-foreground">
          Browse and RSVP to upcoming apartment events.
        </p>
      </div>

      {/* Cinematic featured hero — next upcoming event */}
      {featuredEvent && (
        <ScrollReveal className="mb-12">
          <Link
            href={`/events/${featuredEvent.slug}`}
            className="group relative block h-[52vh] min-h-[320px] w-full overflow-hidden rounded-2xl border border-white/[0.07]"
          >
            <Image
              src={featuredEvent.cover_image_url ?? PLACEHOLDER}
              alt={featuredEvent.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />

            {/* Gold shimmer top edge on hover */}
            <div
              className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(201,162,39,0.7), transparent)",
              }}
              aria-hidden
            />

            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                Next up ·{" "}
                {format(
                  new Date(featuredEvent.starts_at),
                  "EEEE, MMM d · h:mm a"
                )}
              </p>
              <h2 className="font-display text-4xl font-bold text-white transition-colors md:text-6xl">
                {featuredEvent.title}
              </h2>
              <p className="mt-2 text-white/50">{VENUE_ADDRESS}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 group-hover:border-accent/40 group-hover:bg-white/10 group-hover:text-accent">
                View event
                <svg
                  className="h-3.5 w-3.5 translate-x-0 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </ScrollReveal>
      )}

      {/* Tabs */}
      <div className="animate-fade-in delay-100">
        <EventsTabs active={tab} />
      </div>

      {/* Event list */}
      <div className="mt-10 space-y-8">
        {listEvents.length > 0 ? (
          listEvents.map((event, i) => (
            <ScrollReveal key={event.id} delay={i * 80}>
              <EventCard event={event} />
            </ScrollReveal>
          ))
        ) : events?.length === 0 || !featuredEvent ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03]">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground/80">
              {tab === "past" ? "No past events yet" : "No upcoming events"}
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {tab === "past"
                ? "Past events will show up here once they've happened."
                : "Check back soon — something's always being planned."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
