import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/lib/types/database";
import { formatEventDate } from "@/lib/datetime";
import { cn, VENUE_ADDRESS } from "@/lib/utils";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80";

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const imageUrl = event.cover_image_url ?? PLACEHOLDER;
  const dateStr = formatEventDate(event.starts_at, "EEEE, MMM d · h:mm a");

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "card-glow group relative block min-h-[45vh] overflow-hidden rounded-2xl border border-white/[0.07] md:min-h-[50vh]",
        className
      )}
    >
      <Image
        src={imageUrl}
        alt={event.title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 80vw"
      />

      {/* Multi-layer gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

      {/* Gold shimmer top edge on hover */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(201,162,39,0.6), transparent)",
        }}
        aria-hidden
      />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent opacity-90">
          {event.status === "past" ? "Past event" : dateStr}
        </p>
        <h2 className="font-display text-3xl font-bold text-white transition-colors duration-300 group-hover:text-white md:text-5xl">
          {event.title}
        </h2>
        <p className="mt-2 text-sm text-white/60 md:text-base">{VENUE_ADDRESS}</p>
        {event.description && (
          <p className="mt-3 line-clamp-2 max-w-2xl text-sm text-white/50">
            {event.description}
          </p>
        )}

        {/* Arrow indicator */}
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-accent opacity-0 transition-all duration-300 group-hover:opacity-100">
          <span>View details</span>
          <svg
            className="h-3 w-3 translate-x-0 transition-transform duration-200 group-hover:translate-x-1"
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
  );
}
